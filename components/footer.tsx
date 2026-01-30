export function Footer() {
  return (
    <footer className="border-t py-6 px-4 mt-12">
      <div className="max-w-4xl mx-auto text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} <a href="https://absyd.xyz">Absyd</a>. All rights reserved.
      </div>
    </footer>
  );
}