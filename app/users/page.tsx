// this code is part of S2 to display a list of all registered users
// clicking on a user in this list will display /app/users/[userId]/page.tsx
"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import "@ant-design/v5-patch-for-react-19";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios"; // Import axios
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { Button, Card, Table } from "antd";
import type { TableProps } from "antd"; // antd component library allows imports of types
import { getApiDomain } from "@/utils/domain"; // Import the function

// Optionally, you can import a CSS module or file for additional styling:
// import "@/styles/views/Dashboard.scss";

const BASE_URL = getApiDomain(); // Define BASE_URL

// Columns for the antd table of User objects
const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Id",
    dataIndex: "userId",
    key: "userId",
  },
];

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  // const {
  //   // value: token, // is commented out because we dont need to know the token value for logout
  //   // set: setToken, // is commented out because we dont need to set or update the token value
  //   clear: clearToken, // all we need in this scenario is a method to clear the token
  // } = useLocalStorage<string>("token", ""); // if you wanted to select a different token, i.e "lobby", useLocalStorage<string>("lobby", "");

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      router.push("/");
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/api/v1/auth/logout`, // Use BASE_URL
        {},
        {
          headers: {
            UserId: userId,
            Authorization: `${token}`,
          },
        },
      );

      // console.log("Successfully logged out");
    } catch (error) {
      console.error("Failed to log out:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      router.push("/");
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // apiService.get<User[]> returns the parsed JSON object directly,
        // thus we can simply assign it to our users variable.
        const users: User[] = await apiService.get<User[]>("/users");
        setUsers(users);
        // console.log("Fetched users:", users);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Something went wrong while fetching users:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching users.");
        }
      }
    };

    fetchUsers();
  }, [apiService]); // dependency apiService does not re-trigger the useEffect on every render because the hook uses memoization (check useApi.tsx in the hooks).
  // if the dependency array is left empty, the useEffect will trigger exactly once
  // if the dependency array is left away, the useEffect will run on every state change. Since we do a state change to users in the useEffect, this results in an infinite loop.
  // read more here: https://react.dev/reference/react/useEffect#specifying-reactive-dependencies

  return (
    <div className="card-container">
      <Card
        title="Get all users from secure endpoint:"
        loading={!users}
        className="dashboard-container"
      >
        {users && (
          <>
            {/* antd Table: pass the columns and data, plus a rowKey for stable row identity */}
            <Table<User>
              columns={columns}
              dataSource={users}
              rowKey="userId"
              onRow={(row) => ({
                onClick: () => router.push(`/users/${row.userId}`),
                style: { cursor: "pointer" },
              })}
            />
            <Button onClick={handleLogout} type="primary">
              Logout
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
