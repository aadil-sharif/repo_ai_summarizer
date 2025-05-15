"use client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Box, Button, Flex, Spacer, Text } from "@chakra-ui/react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <Flex as="nav" p="4" bg="teal.500" color="white">
      <Text fontWeight="bold">GitHub App</Text>
      <Spacer />
      {session ? (
        <Button onClick={() => signOut()} colorScheme="red">
          Sign Out
        </Button>
      ) : (
        <Button onClick={() => signIn("github")} colorScheme="green">
          Sign In with GitHub
        </Button>
      )}
    </Flex>
  );
}
