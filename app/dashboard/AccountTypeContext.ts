"use client";
import { createContext } from "react";

const AccountTypeContext = createContext<string | null>(null);

export default AccountTypeContext;
