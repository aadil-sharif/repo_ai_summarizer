import RepoList from "./components/RepoList";
import { ColorModeSwitcher } from "./components/ColorModeSwitcher";

export default function Home() {
  return (
    <>
      <header
        style={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}
      >
        <ColorModeSwitcher />
      </header>
      <main>
        <RepoList />
      </main>
    </>
  );
}
