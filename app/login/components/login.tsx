"use client";
import React, { useState } from "react";
import { Alert, Button, Input } from "antd";
import styles from "../login.module.css";

/* eslint-disable @typescript-eslint/no-explicit-any */

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      console.log(data);

      if (!res.ok) {
        throw new Error(data.message || "Login fehlgeschlagen");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("id", data.userId);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Login</h2>
      <Input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={styles.input}
      />
      <Input.Password
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onPressEnter={handleLogin}
        className={styles.input}
      />
      {error && (
        <Alert message={error} type="error" showIcon className={styles.error} />
      )}
      <Button
        type="primary"
        className={styles.button}
        onClick={handleLogin}
        loading={loading}
        disabled={!username || !password}
      >
        Login
      </Button>
    </div>
  );
};

export default Login;
