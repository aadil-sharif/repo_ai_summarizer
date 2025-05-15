"use client";

import { Box, Heading, List, ListItem, Link } from "@chakra-ui/react";

interface Repo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
}

interface RepoListProps {
  repos: Repo[];
}

export default function RepoList({ repos }: RepoListProps) {
  if (!repos.length) {
    return <Box>No repositories found.</Box>;
  }

  return (
    <Box mt={4}>
      <Heading size="md" mb={3}>
        Your GitHub Repositories
      </Heading>
      <List spacing={3}>
        {repos.map((repo) => (
          <ListItem key={repo.id}>
            <Link
              href={repo.html_url}
              isExternal
              color="teal.500"
              fontWeight="bold"
            >
              {repo.name}
            </Link>
            <Box fontSize="sm">{repo.description}</Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
