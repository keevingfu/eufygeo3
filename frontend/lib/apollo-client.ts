import { ApolloClient, InMemoryCache, from, HttpLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
  credentials: 'include',
});

// 错误处理链接
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // 处理特定的网络错误
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      // 处理未授权错误
      console.warn('Unauthorized access - redirecting to login');
      // 可以在这里触发登录重定向
    }
  }
});

// 认证链接（如果需要的话）
const authLink = setContext((_, { headers }) => {
  // 从本地存储或其他地方获取认证token
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  
  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  };
});

// 缓存配置
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        keywords: {
          keyArgs: ['filter', 'sort'],
          merge(existing = { edges: [], pageInfo: {} }, incoming) {
            return {
              ...incoming,
              edges: [...(existing.edges || []), ...incoming.edges],
              pageInfo: incoming.pageInfo,
            };
          },
        },
      },
    },
    Keyword: {
      fields: {
        metrics: {
          merge: true,
        },
        aioStatus: {
          merge: true,
        },
      },
    },
  },
});

// 创建 Apollo Client 实例
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
});

export default apolloClient;