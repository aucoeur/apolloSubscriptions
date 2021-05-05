const { ApolloServer, gql, PubSub } = require('apollo-server');

const pubsub = new PubSub();

const typeDefs = gql`
	type Post {
		message: String!
		date: String!
	}

  type Channel {
    name: String
    posts: [Post!]!
  }

	type Query {
		posts(channel: String!): [Post!]!
    channels: [Channel]!
	}

	type Mutation {
		addPost(channel: String!, message: String!) : Post!
    addChannel(name: String!) : Channel!
	}

	type Subscription {
		newPost(channel: String!): Post!
    newChannel: Channel!

	}
`

const channels = [
	{
    name: 'general',
    posts: [
      { message: 'hello world',
        date: new Date() }
    ]
  },
  {
    name: 'cats',
    posts: [
      { message: 'meow world',
        date: new Date() },
      { message: 'hiss',
        date: new Date() },
    ]
  },
]

const resolvers = {
  Post: {
    message: (parent) => {
      return parent.message
    },
    date: (parent) => {
      return new Date(parent.date).toLocaleDateString()
    }
  },
  Channel: {
    name: (parent) => {
      return parent.name
    },
    posts: (parent) => {
      return parent.posts
    }
  },
	Query: {
		posts: ({ channel }) => {
			return channels.filter(c => c.name === channel)
		},
    channels: () => {
      return channels
    }
	},
	Mutation: {
		addPost: (_, { channel, message }) => {
			const post = { message, date: new Date() }
      channels.find(c => c.name === channel ? c.posts.push(post) : null)
			pubsub.publish('NEW_POST', { newPost: post })
			return post
		},
    addChannel: (_, { name }) => {
      const channel = { name }
      pubsub.publish('NEW_CHANNEL', { newChannel: channel })
      return channel
    }
	},
	Subscription: {
		newPost: {
			subscribe: () => pubsub.asyncIterator('NEW_POST')
		},
    newChannel: {
      subscribe: () => pubsub.asyncIterator('NEW_CHANNEL')
    }
	}
}

const server = new ApolloServer({
	typeDefs,
	resolvers
});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
	console.log(`🚀 Server ready at ${url}graphql`);
});
