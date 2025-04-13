"use client";
import React, { useState } from "react";
import { Alert, Button, Input } from "antd";
import styles from "../login.module.css";
import axios from "axios";

const BASE_URL = process.env.NODE_ENV === "production"
  ? "https://sopra-fs25-group-39-client.vercel.app"
  : "http://localhost:5001";

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
      const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        username,
        password,
      });

      const data = res.data;

      if (res.status !== 200) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("id", data.user.id);
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
