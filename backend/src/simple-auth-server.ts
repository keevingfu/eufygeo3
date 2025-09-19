import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Mock user database
const users = [
  {
    id: '1',
    email: 'admin@eufy.com',
    password: 'test123', // In production, this should be hashed
    username: 'admin',
    role: 'ADMIN'
  },
  {
    id: '2',
    email: 'user@eufy.com',
    password: 'test123',
    username: 'user',
    role: 'USER'
  }
];

// GraphQL endpoint
app.post('/graphql', (req, res) => {
  const { query, variables } = req.body;
  
  // Parse the GraphQL query to check if it's a login mutation
  if (query.includes('mutation Login')) {
    const { input } = variables;
    const user = users.find(u => u.email === input.email && u.password === input.password);
    
    if (user) {
      // Generate a mock JWT token
      const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');
      
      res.json({
        data: {
          login: {
            access_token: `mock-jwt-token-${token}`,
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role
            }
          }
        }
      });
    } else {
      res.status(200).json({
        errors: [{
          message: '用户名或密码错误',
          extensions: {
            code: 'UNAUTHENTICATED'
          }
        }]
      });
    }
  } else {
    res.status(400).json({
      errors: [{
        message: 'Unsupported operation'
      }]
    });
  }
});

const PORT = 4003;
app.listen(PORT, () => {
  console.log(`🚀 Mock Auth Server running on http://localhost:${PORT}`);
  console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
  console.log(`\n🔐 Test credentials:`);
  console.log(`  Email: admin@eufy.com`);
  console.log(`  Password: test123`);
  console.log(`\n  Email: user@eufy.com`);
  console.log(`  Password: test123`);
});