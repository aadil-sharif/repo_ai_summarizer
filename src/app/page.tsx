/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Text } from "@chakra-ui/react";
import {
  Box,
  Button,
  Heading,
  Input,
  List,
  ListItem,
  Spinner,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";

type Repo = {
  id: number;
  name: string;
  full_name: string;
};

type FileContent = {
  content: string; // base64 encoded content from GitHub
  sha: string; // needed for updating files
};

export default function Page() {
  const { data: session, status } = useSession();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileSha, setFileSha] = useState<string>("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRepos();
    }
  }, [status]);

  async function fetchRepos() {
    setLoadingRepos(true);
    try {
      // Use GitHub API to get user repos
      const res = await axios.get("https://api.github.com/user/repos", {
        headers: {
          Authorization: `token ${(session as any).accessToken}`,
        },
      });
      setRepos(res.data);
    } catch (error) {
      alert("Error loading repos. Check console.");
      console.error(error);
    }
    setLoadingRepos(false);
  }

  async function fetchFiles(repoFullName: string) {
    setLoadingFiles(true);
    try {
      // Get root directory contents
      const res = await axios.get(
        `https://api.github.com/repos/${repoFullName}/contents/`,
        {
          headers: {
            Authorization: `token ${(session as any).accessToken}`,
          },
        }
      );
      // Filter files only (skip folders)
      const onlyFiles = res.data
        .filter((f: any) => f.type === "file")
        .map((f: any) => f.name);
      setFiles(onlyFiles);
    } catch (error) {
      alert("Error loading files. Check console.");
      console.error(error);
    }
    setLoadingFiles(false);
  }

  async function fetchFileContent(repoFullName: string, path: string) {
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${repoFullName}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${(session as any).accessToken}`,
          },
        }
      );
      setFileContent(atob(res.data.content));
      setFileSha(res.data.sha);
    } catch (error) {
      alert("Error loading file content. Check console.");
      console.error(error);
    }
  }

  async function saveFile() {
    if (!selectedRepo || !selectedFile) return;
    setSaving(true);
    try {
      await axios.put(
        `https://api.github.com/repos/${selectedRepo.full_name}/contents/${selectedFile}`,
        {
          message: `Update ${selectedFile} via my app`,
          content: btoa(fileContent),
          sha: fileSha,
        },
        {
          headers: {
            Authorization: `token ${(session as any).accessToken}`,
          },
        }
      );
      alert("File saved successfully!");
      // refetch content to get new sha
      await fetchFileContent(selectedRepo.full_name, selectedFile);
    } catch (error) {
      alert("Error saving file. Check console.");
      console.error(error);
    }
    setSaving(false);
  }

  if (status === "loading") {
    return (
      <Box p={6}>
        <Spinner />
        <Text>Loading session...</Text>
      </Box>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <Box p={6} textAlign="center">
        <Heading mb={4}>Please login first</Heading>
        <Button colorScheme="blue" onClick={() => signIn("github")}>
          Login with GitHub
        </Button>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="3xl" mx="auto">
      <Button mb={4} colorScheme="red" onClick={() => signOut()}>
        Logout
      </Button>

      {!selectedRepo ? (
        <>
          <Heading size="md" mb={4}>
            Your GitHub Repositories
          </Heading>
          {loadingRepos ? (
            <Spinner />
          ) : (
            <List spacing={2}>
              {repos.map((repo) => (
                <ListItem
                  key={repo.id}
                  cursor="pointer"
                  color="blue.500"
                  onClick={() => {
                    setSelectedRepo(repo);
                    fetchFiles(repo.full_name);
                  }}
                >
                  {repo.name}
                </ListItem>
              ))}
            </List>
          )}
        </>
      ) : !selectedFile ? (
        <>
          <Button mb={4} onClick={() => setSelectedRepo(null)}>
            ← Back to repos
          </Button>
          <Heading size="md" mb={4}>
            Files in {selectedRepo.name}
          </Heading>
          {loadingFiles ? (
            <Spinner />
          ) : files.length === 0 ? (
            <Text>No files found in repo root.</Text>
          ) : (
            <List spacing={2}>
              {files.map((file) => (
                <ListItem
                  key={file}
                  cursor="pointer"
                  color="green.500"
                  onClick={() => {
                    setSelectedFile(file);
                    fetchFileContent(selectedRepo.full_name, file);
                  }}
                >
                  {file}
                </ListItem>
              ))}
            </List>
          )}
        </>
      ) : (
        <>
          <Button mb={4} onClick={() => setSelectedFile(null)}>
            ← Back to files
          </Button>
          <Heading size="md" mb={2}>
            Editing: {selectedFile}
          </Heading>
          <Textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            minH="300px"
            mb={4}
            fontFamily="monospace"
          />
          <Button
            colorScheme="blue"
            onClick={saveFile}
            isLoading={saving}
            loadingText="Saving"
          >
            Save Changes
          </Button>
        </>
      )}
    </Box>
  );
}
