"use client";

import { Flex, Heading } from "@chakra-ui/react";

export default function Header() {
  return (
    <Flex as="header" bg="gray.100" p={4} mb={4} align="center">
      <Heading size="md">My AI Dev Showcase</Heading>
    </Flex>
  );
}
