<template>
  <v-container>
    <v-layout
      text-center
      wrap
    >
      <v-flex xs12>
        <h1>Search User</h1>
        <div v-if="$apollo.queries.user.loading"></div>
        <div v-if="error">{{ error }}</div>
        <div>Loading...</div>
        {{ user }}
      </v-flex>

      <v-flex xs12>
        <h1>Add user</h1>
        <v-form>
          <v-text-field v-model="newId" label="id"></v-text-field>
          <v-text-field v-model="newUser" label="Name"></v-text-field>
          <v-btn @click="addUser">Add</v-btn>
        </v-form>
      </v-flex>

      <v-flex xs12>
        <h1>Edit active status to user</h1>
        <v-form>
          <v-text-field v-model="userId" label="id"></v-text-field>
          <v-checkbox v-model="isActive" label="Active"></v-checkbox>
          <v-btn @click="updateUser">Update</v-btn>
        </v-form>
      </v-flex>

      <v-flex xs12>
        <h1>Add user and posts</h1>
        <v-form>
          <v-text-field v-model="userId" label="id"></v-text-field>
          <v-text-field v-model="newUser" label="Name"></v-text-field>
          <v-text-field v-model="postId" label="id"></v-text-field>
          <v-text-field v-model="postTitle" label="Post title"></v-text-field>
          <v-text-field v-model="postContent" label="Post content"></v-text-field>
          <v-btn @click="addUserAndPosts">Add</v-btn>
          <v-spacer></v-spacer>
          {{ user }}
        </v-form>
      </v-flex>

      <v-flex xs12>
        <h1>Posts and tags</h1>
        <v-btn @click="addPostAndTags">Add post and tags</v-btn>
        <v-spacer></v-spacer>
        {{ post }}
      </v-flex>

      <v-flex xs12>
        <h1>Remove user</h1>
        {{ users }}
        <v-form>
          <v-text-field v-model="userId" label="id"></v-text-field>
          <v-btn @click="removeUser">Remove</v-btn>
        </v-form>
      </v-flex>

      <v-flex xs12>
        <h1>Subscription</h1>
        <p>User updated: {{ suscribedUser }}</p>
      </v-flex>

    </v-layout>
  </v-container>
</template>

<script>
import gql from "graphql-tag";

const ADD_USER = gql`
  mutation ($id: Int, $name: String) {
    insert_user(objects: {id: $id, name: $name}) {
      affected_rows
      returning {
        id
        name
      }
  }
}
`;

const UPDATE_ACTIVE_USER = gql`
  mutation updateActiveUser($id: Int, $active: Boolean) {
      update_user(where: { id: { _eq: $id } }, _set: { active: $active }) {
          affected_rows
      }
  }
`;

const ADD_USER_AND_POSTS = gql`
  mutation MyMutation($id: Int, $name: String, $posts: [post_insert_input!]!) {
    insert_user(objects: {id: $id, name: $name, posts: {data: $posts}}) {
        affected_rows
        returning {
            id
            name
            posts {
                id
                title
                content
            }
        }
    }
  }
`;

const GET_USER_AND_POSTS = gql`
  query {
    user {
      id
      name
      posts {
        id
        title
        content
      }
    }
  }
`;

const ADD_POST_AND_TAGS = gql`
  mutation MyMutation($postId: Int, $postTitle: String, $postContent: String, $tag: [post_tag_insert_input!]!) {
    insert_post(objects: {
      id: $postId,
      title: $postTitle,
      content: $postContent,
      user_id: 100,
      post_tags: {
        data: $tag
      }
    }) {
      affected_rows
      returning {
        id
        title
        content
        post_tags {
          tag {
            id
            name
          }
        }
      }
    }
  }
`;

const GET_POST_AND_TAGS = gql`
  query MyQuery {
    post {
      id
      title
      content
      post_tags {
        tag {
          id
          name
        }
      }
    }
  }
`;

const REMOVE_USER = gql`
  mutation MyMutation($id: Int) {
    delete_user(where: {id: {_eq: $id}}) {
      affected_rows
    }
  }
`;

const GET_USERS = gql`
  query MyQuery {
    users: user {
      id
      name
    }
  }
`;

const SUBSCRIPTION_NEW_USER = gql`
  subscription MySubscription {
    user(where: {id: {_eq: 19}}) {
      id
      name
      active
    }
  }
`;

export default {
  name: 'HelloWorld',

  data: () => ({
    newUser: null,
    newId: null,
    userId: null,
    isActive: false,
    error: null,
    postId: null,
    postTitle: null,
    postContent: null,
    suscribedUser: null,
  }),
  apollo: {
    users: {
      query: GET_USERS
    },
    user: {
      query: GET_USER_AND_POSTS,
      error(error) {
        this.error = JSON.stringify(error.message);
      }
    },
    post: {
      query: GET_POST_AND_TAGS,
      error(error) {
        this.error = JSON.stringify(error.message);
      }
    },
    $subscribe: {
      user: {
        query: SUBSCRIPTION_NEW_USER,
        result (data) {
          this.suscribedUser = data.data.user;
        }
      }
    }
  },
  methods: {
    addUser : function() {
      this.$apollo.mutate({
        mutation: ADD_USER,
        variables: {
          id: parseInt(this.newId),
          name: this.newUser
        },
        update: (cache, { data: { insert_user } }) => {
          try {
            //Read query from cache
            const data = cache.readQuery({
              query: GET_USERS
            });
            //Get the response from mutation
            const insertedUser = insert_user.returning;
            //Insert the new user to the actual user's list
            data.users.splice(0, 0, insertedUser[0]);
            //Write the query to the cache
            cache.writeQuery({
              query: GET_USERS,
              data
            });
            this.newId = null;
            this.newUser = null;
          } catch(e) {
            console.error(e);
          }
        }
      });
    },
    updateUser: function() {
      const id = parseInt(this.userId);
      this.$apollo.mutate({
        mutation: UPDATE_ACTIVE_USER,
        variables: {
          id: parseInt(this.userId),
          active: this.isActive
        },
        update: (store, { data: { update_user } }) => {
          if (update_user.affected_rows) {
            const data = store.readQuery({
              query: GET_USERS
            });
            const activedUser = data.users.find(t => t.id === id);
            activedUser.active = this.isActive;
            store.writeQuery({
              query: GET_USERS,
              data
            });
          }
        },
        optimisticResponse: {
          __typename: 'Mutation',
          update_user: {
            __typename: 'user',
            id: id,
            active: this.isActive,
            affected_rows: 1
          }
        }
      });
    },
    addUserAndPosts: function() {
      this.$apollo.mutate({
        mutation: ADD_USER_AND_POSTS,
        variables: {
          id: parseInt(this.userId),
          name: this.newUser,
          posts: [
            {
              id: parseInt(this.postId),
              title: this.postTitle,
              content: this.postContent
            }
          ]
        },
        update: (cache, { data: { insert_user } }) => {
          try {
            //Read query from cache
            const data = cache.readQuery({
              query: GET_USER_AND_POSTS
            });
            //Get the response from mutation
            const insertedUser = insert_user.returning;
            //Insert the new user to the actual user's list
            data.users.splice(0, 0, insertedUser[0]);
            //Write the query to the cache
            cache.writeQuery({
              query: GET_USER_AND_POSTS,
              data
            });
            this.userId = null;
            this.newUser = null;
            this.postId = null;
            this.postTitle = null;
            this.postContent = null;
          } catch(e) {
            console.error(e);
          }
        }
      });
    },
    addPostAndTags: function(){
      this.$apollo.mutate({
        mutation: ADD_POST_AND_TAGS,
        variables: {
          postId: 215,
          postTitle: "TEST 3",
          postContent: "I don't know",
          tag: [
            {
              tag: {
                data: {
                  id: 1,
                  name: "Info"
                },
                on_conflict: {
                  "constraint": "tag_pk",
                  "update_columns": "name"
                }
              }
            },
            {
              tag: {
                data: {
                  id: 100,
                  name: "Entertainment"
                },
                on_conflict: {
                  constraint: "tag_pk",
                  update_columns: "name"
                }
              }
            }
          ]
        },
        update: (cache, { data: { insert_post } }) => {
          try {
            //Read query from cache
            const data = cache.readQuery({
              query: GET_POST_AND_TAGS
            });
            //Get the response from mutation
            const insertedPost = insert_post.returning;
            //Insert the new user to the actual user's list
            data.post.splice(0, 0, insertedPost[0]);
            //Write the query to the cache
            cache.writeQuery({
              query: GET_POST_AND_TAGS,
              data
            });
          } catch(e) {
            console.error(e);
          }
        }
      });
    },
    removeUser: function() {
      this.$apollo.mutate({
        mutation: REMOVE_USER,
        variables: {
          id: parseInt(this.userId)
        },
        update: (store, { data: { delete_user } }) => {
          if (delete_user.affected_rows) {
            const data = store.readQuery({
              query: GET_USERS
            });
            data.users = data.users.filter(t => {
              return t.id !== parseInt(this.userId);
            });
            store.writeQuery({
              query: GET_USERS,
              data
            });
          }
        }
      })
    }
  }
};
</script>
