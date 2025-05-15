"use client";

import { useEffect, useState } from "react";
import { Input, VStack, Heading, Text } from "@chakra-ui/react";
import RepoCard from "./RepoCard";

interface Repo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
}

export default function RepoList() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/github/repos")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setRepos(data);
        }
      })
      .catch(() => setError("Failed to load repos"));
  }, []);

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <VStack spacing={4} align="stretch" maxW="800px" mx="auto" mt={8}>
      <Heading as="h2" size="lg" textAlign="center">
        My GitHub Repositories
      </Heading>

      <Input
        placeholder="Search repositories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="md"
      />

      {error && <Text color="red.500">{error}</Text>}

      {filteredRepos.length === 0 && !error && <Text>No repos found.</Text>}

      {filteredRepos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </VStack>
  );
}
