"use client";

import { useState } from "react";
import { Box, Button, Text, Link } from "@chakra-ui/react";
import { motion } from "framer-motion";
import axios from "axios";

const MotionBox = motion(Box);

interface Repo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
}

export default function RepoCard({ repo }: { repo: Repo }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateSummary() {
    setLoading(true);
    try {
      const res = await axios.post("/api/openai/summary", {
        repoName: repo.name,
        repoDesc: repo.description ?? "",
      });
      setSummary(res.data.summary);
    } catch {
      setSummary("Failed to generate summary.");
    }
    setLoading(false);
  }

  return (
    <MotionBox
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300 }}
      p={4}
      m={4}
      borderRadius="md"
      boxShadow="md"
      bg="gray.100"
      _dark={{ bg: "gray.700" }}
    >
      <Link href={repo.html_url} isExternal fontWeight="bold" fontSize="xl">
        {repo.name}
      </Link>
      <Text mt={2}>{repo.description || "No description"}</Text>

      <Button
        mt={4}
        onClick={generateSummary}
        isLoading={loading}
        size="sm"
        colorScheme="teal"
      >
        Generate AI Summary
      </Button>

      {summary && (
        <Text
          mt={2}
          fontStyle="italic"
          color="gray.600"
          _dark={{ color: "gray.300" }}
        >
          {summary}
        </Text>
      )}
    </MotionBox>
  );
}
