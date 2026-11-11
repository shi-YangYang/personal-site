export const personalEn = {
  name: "Your Name",
  initials: "YN",
  role: "Full-Stack Engineer",
  tagline: "Crafting Digital Experiences",
  bio: "Passionate about solving real problems with code. From frontend to backend, product to design, I love taking an idea from zero to one.",
  location: "Earth",
  email: "hello@example.com",
  siteTitle: "My Site",
  socials: {
    github: "https://github.com/yourname",
    csdn: "https://blog.csdn.net/yourname",
    qq: "https://wpa.qq.com/msgrd?v=3&uin=your_qq&site=qq&menu=yes",
    x: "https://x.com/yourname",
  },
  skills: [
    {
      category: "frontend",
      label: "Frontend",
      items: [
        { name: "React / Next.js", level: 90 },
        { name: "TypeScript", level: 85 },
        { name: "Vue 3", level: 75 },
        { name: "Tailwind CSS", level: 88 },
      ],
    },
    {
      category: "backend",
      label: "Backend",
      items: [
        { name: "Node.js", level: 80 },
        { name: "Python", level: 75 },
        { name: "PostgreSQL", level: 78 },
        { name: "Redis", level: 70 },
      ],
    },
    {
      category: "tools",
      label: "Tools & Design",
      items: [
        { name: "Docker", level: 78 },
        { name: "Figma", level: 82 },
        { name: "Git", level: 88 },
        { name: "Linux", level: 80 },
      ],
    },
  ],
  experience: [
    {
      company: "Example Company A",
      role: "Full-stack Engineer",
      period: "2023 - Present",
      location: "Remote",
      description:
        "Provided product design and full-stack development services for multiple startup teams, covering everything from requirement analysis to launch.",
      tags: ["Next.js", "TypeScript", "PostgreSQL", "Docker"],
    },
    {
      company: "Example Company B",
      role: "Senior Frontend Engineer",
      period: "2021 - 2023",
      location: "Shanghai",
      description:
        "Led the frontend architecture upgrade of the core product, drove SSR migration, achieving a 60% first-paint performance improvement.",
      tags: ["React", "Next.js", "Micro-frontend"],
    },
    {
      company: "Example Company C",
      role: "Frontend Engineer",
      period: "2019 - 2021",
      location: "Beijing",
      description:
        "Participated in multiple ToB product developments, led the component library initiative with 50+ reusable components.",
      tags: ["Vue", "TypeScript", "Component Library"],
    },
  ],
  projects: [
    {
      slug: "project-one",
      title: "Example Project One",
      description:
        "Replace with your project description. What it does, what tech it uses, what problem it solves.",
      longDescription:
        "Write the full background, design decisions, and implementation details here, as long as you like.",
      year: "2024",
      highlights: [
        "Key highlight or outcome one",
        "Key highlight or outcome two",
        "Key highlight or outcome three",
      ],
      tags: ["Next.js", "Tauri", "SQLite"],
      size: "large" as const,
      links: {
        demo: "https://example.com",
        code: "https://github.com/yourname/project",
      },
    },
    {
      slug: "project-two",
      title: "Example Project Two",
      description: "Another project's brief.",
      year: "2023",
      tags: ["Go", "Redis"],
      size: "small" as const,
      links: { code: "https://github.com/yourname/project" },
    },
    {
      slug: "project-three",
      title: "Example Project Three",
      description: "Could be a tool, library, or plugin.",
      year: "2023",
      tags: ["React", "Tailwind"],
      size: "small" as const,
      links: { demo: "https://example.com" },
    },
    {
      slug: "project-four",
      title: "Example Project Four",
      description: "A fourth project, keep it concise.",
      year: "2022",
      tags: ["Next.js", "MDX"],
      size: "small" as const,
      links: { code: "https://github.com/yourname/project" },
    },
  ],
  friendLinks: [
    {
      name: "Example Link A",
      url: "https://example-a.com",
      description: "A sample friend link. Replace with a real site.",
    },
    {
      name: "Example Link B",
      url: "https://example-b.com",
      description: "Another sample friend link.",
    },
    {
      name: "Example Link C",
      url: "https://example-c.com",
      description: "A third sample friend link.",
    },
  ],
};
