"use client";
import { FetchWrapper } from "@/utils/fetch-wrapper";

const getToken = () => localStorage.getItem("auth_token"); // Adjust based on how you're storing the token

export const apiClient = new FetchWrapper(getToken);
