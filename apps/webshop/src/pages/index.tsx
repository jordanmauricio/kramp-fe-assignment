import { useEffect, useState } from 'react';
import styles from './index.module.css';

interface User {
  id: string;
  fullName: string;
}

export function Index() {
  const [user, setUser] = useState<User>();

  useEffect(() => {
    fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            user(id: 1) {
              id
              fullName
            }
          }
        `,
      }),
    })
      .then(res => res.json())
      .then(data => {
        setUser(data.data.user);
      });
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <h1>Welcome to Kramp, {user.fullName}!</h1>
    </div>
  );
}

export default Index;
