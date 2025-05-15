/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Spinner,
  Text,
  VStack,
  HStack,
  useColorMode,
  useColorModeValue,
  Avatar,
  Collapse,
  useDisclosure,
  Tooltip,
  Divider,
  useToast,
} from "@chakra-ui/react";
import {
  FiMenu,
  FiSun,
  FiMoon,
  FiFolder,
  FiFile,
  FiChevronDown,
  FiChevronRight,
  FiRefreshCw,
} from "react-icons/fi";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import axios from "axios";

// Dynamic import MonacoEditor (client only)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string;
  default_branch: string;
  owner: { login: string; avatar_url: string };
};

type TreeItem = {
  path: string;
  type: "blob" | "tree";
  mode: string;
  url: string;
};

type TreeNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
};

const MotionHeading = motion(Heading);

export default function Page() {
  // --- Auth & Session ---
  const { data: session, status } = useSession();
  const toast = useToast();

  // --- Color Mode ---
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue("gray.50", "gray.900");
  const sidebarBg = useColorModeValue("white", "gray.800");
  const editorBg = useColorModeValue("gray.100", "gray.900");

  // --- UI State ---
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);

  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileSha, setFileSha] = useState<string>("");

  const [saving, setSaving] = useState(false);

  const [summary, setSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Collapse state for summary panel
  const { isOpen: summaryOpen, onToggle: toggleSummary } = useDisclosure();

  // --- Effects ---
  useEffect(() => {
    if (status === "authenticated") {
      fetchRepos();
    }
  }, [status]);

  // --- Helpers ---

  function buildTree(treeItems: TreeItem[]): TreeNode[] {
    const root: TreeNode[] = [];

    const pathMap = new Map<string, TreeNode>();

    for (const item of treeItems) {
      const parts = item.path.split("/");
      let currentLevel = root;

      parts.forEach((part, i) => {
        const isFile = i === parts.length - 1 && item.type === "blob";
        const existingNode = currentLevel.find((n) => n.name === part);

        if (!existingNode) {
          const newNode: TreeNode = {
            name: part,
            path: parts.slice(0, i + 1).join("/"),
            type: isFile ? "file" : "folder",
            children: isFile ? undefined : [],
          };
          currentLevel.push(newNode);
          if (!isFile) {
            pathMap.set(newNode.path, newNode);
          }
          if (!isFile) currentLevel = newNode.children!;
        } else {
          if (!isFile) currentLevel = existingNode.children!;
        }
      });
    }

    return root;
  }

  async function fetchRepos() {
    setLoadingRepos(true);
    try {
      const res = await axios.get("https://api.github.com/user/repos", {
        headers: {
          Authorization: `token ${(session as any).accessToken}`,
        },
      });
      setRepos(res.data);
    } catch (error) {
      toast({
        title: "Failed to load repositories.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
    setLoadingRepos(false);
  }

  async function fetchRepoTree(repo: Repo) {
    setLoadingTree(true);
    setSelectedFilePath(null);
    setFileContent("");
    setFileSha("");
    setSummary("");
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`,
        {
          headers: {
            Authorization: `token ${(session as any).accessToken}`,
          },
        }
      );
      const nodes = buildTree(res.data.tree);
      setTree(nodes);
    } catch (error) {
      toast({
        title: "Failed to load repo tree.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
    setLoadingTree(false);
  }

  async function fetchFileContent(repoFullName: string, path: string) {
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${repoFullName}/contents/${encodeURIComponent(
          path
        )}`,
        {
          headers: {
            Authorization: `token ${(session as any).accessToken}`,
          },
        }
      );
      setFileContent(atob(res.data.content));
      setFileSha(res.data.sha);
      setSelectedFilePath(path);
    } catch (error) {
      toast({
        title: "Failed to load file content.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  async function saveFile() {
    if (!selectedRepo || !selectedFilePath) return;
    setSaving(true);
    try {
      await axios.put(
        `https://api.github.com/repos/${
          selectedRepo.full_name
        }/contents/${encodeURIComponent(selectedFilePath)}`,
        {
          message: `Update ${selectedFilePath} via app`,
          content: btoa(fileContent),
          sha: fileSha,
        },
        {
          headers: {
            Authorization: `token ${(session as any).accessToken}`,
          },
        }
      );
      toast({
        title: "File saved successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Refresh file content to update sha
      await fetchFileContent(selectedRepo.full_name, selectedFilePath);
    } catch (error) {
      toast({
        title: "Failed to save file.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
    setSaving(false);
  }

  async function generateSummary() {
    if (!selectedRepo) return;
    setLoadingSummary(true);
    setSummary("");
    try {
      const res = await axios.post("/api/summarize", {
        repoName: selectedRepo.name,
        repoDesc: selectedRepo.description || "",
      });
      setSummary(res.data.summary);
      if (!summaryOpen) toggleSummary();
    } catch (error) {
      toast({
        title: "Failed to generate summary.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
    setLoadingSummary(false);
  }

  // --- Render ---

  if (status === "loading") {
    return (
      <Flex h="100vh" justify="center" align="center" bg={bg}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <Flex
        h="100vh"
        direction="column"
        justify="center"
        align="center"
        bg={bg}
        px={4}
      >
        <MotionHeading
          mb={6}
          fontSize="5xl"
          animate={{ rotate: [0, 10, -10, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          bgGradient="linear(to-r, teal.500, green.500)"
          bgClip="text"
          fontWeight="extrabold"
        >
          Dev Playground
        </MotionHeading>
        <Button
          colorScheme="teal"
          size="lg"
          onClick={() => signIn("github")}
          leftIcon={<FiSun />}
        >
          Login with GitHub
        </Button>
      </Flex>
    );
  }

  // --- Recursive folder tree rendering ---
  function FolderNode({ node }: { node: TreeNode }) {
    const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });

    if (node.type === "file") {
      return (
        <Text
          pl={8}
          cursor="pointer"
          _hover={{ bg: useColorModeValue("gray.200", "gray.700") }}
          onClick={() => fetchFileContent(selectedRepo!.full_name, node.path)}
          color={selectedFilePath === node.path ? "teal.400" : undefined}
        >
          <FiFile style={{ display: "inline", marginRight: 6 }} />
          {node.name}
        </Text>
      );
    }

    // folder
    return (
      <Box pl={4} userSelect="none">
        <HStack
          cursor="pointer"
          onClick={onToggle}
          _hover={{ bg: useColorModeValue("gray.200", "gray.700") }}
          color="teal.400"
          borderRadius="md"
          p={1}
        >
          {isOpen ? <FiChevronDown /> : <FiChevronRight />}
          <FiFolder />
          <Text fontWeight="bold">{node.name}</Text>
        </HStack>
        <Collapse in={isOpen} unmountOnExit>
          <VStack pl={4} align="start" spacing={1} mt={1}>
            {node.children?.map((child) => (
              <FolderNode key={child.path} node={child} />
            ))}
          </VStack>
        </Collapse>
      </Box>
    );
  }

  return (
    <Flex direction="column" h="100vh" bg={bg}>
      {/* Header */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        px={6}
        py={3}
        borderBottom="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        bg={useColorModeValue("white", "gray.800")}
        boxShadow="md"
        zIndex={100}
      >
        <HStack spacing={3}>
          <IconButton
            aria-label="Toggle sidebar"
            icon={<FiMenu />}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
          />
          <MotionHeading
            fontSize="2xl"
            fontWeight="extrabold"
            bgGradient="linear(to-r, teal.400, green.400)"
            bgClip="text"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Dev Playground
          </MotionHeading>
        </HStack>

        <HStack spacing={4}>
          <Tooltip label="Toggle Dark/Light mode">
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
              onClick={toggleColorMode}
              variant="ghost"
              size="lg"
            />
          </Tooltip>

          <HStack spacing={2}>
            <Text>{(session as any).user?.name}</Text>
            <Avatar
              size="sm"
              src={(session as any).user?.image}
              name={(session as any).user?.name}
            />
          </HStack>

          <Button colorScheme="red" onClick={() => signOut()}>
            Logout
          </Button>
        </HStack>
      </Flex>

      {/* Main content */}
      <Flex flex={1} overflow="hidden">
        {/* Sidebar */}
        <Box
          w={sidebarOpen ? 320 : 0}
          bg={sidebarBg}
          borderRight="1px solid"
          borderColor={useColorModeValue("gray.200", "gray.700")}
          overflowY="auto"
          transition="width 0.3s"
        >
          <Box p={4}>
            <Heading size="md" mb={3}>
              Repositories
            </Heading>

            {loadingRepos ? (
              <Spinner />
            ) : (
              <VStack align="stretch" spacing={1}>
                {repos.map((repo) => (
                  <Button
                    key={repo.id}
                    variant={selectedRepo?.id === repo.id ? "solid" : "ghost"}
                    colorScheme="teal"
                    justifyContent="flex-start"
                    onClick={() => {
                      setSelectedRepo(repo);
                      fetchRepoTree(repo);
                      setSummary("");
                    }}
                    overflow="hidden"
                    whiteSpace="nowrap"
                    textOverflow="ellipsis"
                  >
                    {repo.name}
                  </Button>
                ))}
              </VStack>
            )}

            <Divider my={4} />

            <HStack justify="space-between" mb={2}>
              <Heading size="sm">Files</Heading>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedRepo) fetchRepoTree(selectedRepo);
                }}
                isLoading={loadingTree}
                leftIcon={<FiRefreshCw />}
              >
                Refresh
              </Button>
            </HStack>

            {selectedRepo ? (
              loadingTree ? (
                <Spinner />
              ) : (
                <Box maxH="50vh" overflowY="auto">
                  {tree.length === 0 && (
                    <Text fontStyle="italic" color="gray.500">
                      No files found
                    </Text>
                  )}
                  {tree.map((node) => (
                    <FolderNode key={node.path} node={node} />
                  ))}
                </Box>
              )
            ) : (
              <Text>Select a repository</Text>
            )}

            <Divider my={4} />

            <Button
              size="sm"
              colorScheme="purple"
              w="100%"
              onClick={generateSummary}
              isLoading={loadingSummary}
              isDisabled={!selectedRepo}
            >
              {summaryOpen ? "Hide" : "Show"} Summary
            </Button>

            <Collapse in={summaryOpen} mt={3}>
              <Box
                bg={useColorModeValue("purple.50", "purple.900")}
                p={3}
                borderRadius="md"
                fontSize="sm"
                whiteSpace="pre-wrap"
              >
                {summary || "No summary generated yet."}
              </Box>
            </Collapse>
          </Box>
        </Box>

        {/* Editor Panel */}
        <Box flex={1} bg={editorBg} p={4} overflow="hidden" position="relative">
          {selectedFilePath ? (
            <>
              <Flex
                justify="space-between"
                align="center"
                mb={2}
                borderBottom="1px solid"
                borderColor={useColorModeValue("gray.300", "gray.600")}
                pb={2}
              >
                <Text fontWeight="bold" fontSize="lg" isTruncated>
                  {selectedFilePath}
                </Text>
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={saveFile}
                  isLoading={saving}
                >
                  Save
                </Button>
              </Flex>

              <Box h="calc(100% - 48px)" borderRadius="md" overflow="hidden">
                <MonacoEditor
                  height="100%"
                  defaultLanguage="javascript"
                  theme={colorMode === "light" ? "vs-light" : "vs-dark"}
                  value={fileContent}
                  onChange={(val) => setFileContent(val || "")}
                  options={{
                    minimap: { enabled: false },
                    wordWrap: "on",
                    fontSize: 14,
                    automaticLayout: true,
                  }}
                />
              </Box>
            </>
          ) : (
            <Flex
              h="100%"
              justify="center"
              align="center"
              color={useColorModeValue("gray.400", "gray.600")}
              fontSize="xl"
              fontStyle="italic"
            >
              Select a file to start editing
            </Flex>
          )}
        </Box>
      </Flex>
    </Flex>
  );
}
