import bcrypt from "bcrypt";
import { Types } from "mongoose";

import { connectDatabase, disconnectDatabase } from "./database/mongodb.js";
import { UserModel, UserRole } from "./modules/auth/user.model.js";
import { TaskModel, TaskPriority, TaskStatus } from "./modules/tasks/task.model.js";

const PASSWORD_SALT_ROUNDS = 12;

const SAMPLE_OWNER_EMAIL = "demo@aethermind.ai";
const SAMPLE_OWNER_PASSWORD = "DemoPassword123!";

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

const sampleTasks = [
  {
    title: "Design landing page hero section",
    description: "Create a compelling hero section with product value proposition and CTA for the marketing site.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    startDate: daysFromNow(-1),
    dueDate: daysFromNow(2),
    estimatedMinutes: 240,
    tags: ["design", "marketing", "frontend"],
  },
  {
    title: "Implement JWT refresh token rotation",
    description: "Add refresh token rotation with reuse detection to prevent token replay attacks.",
    status: TaskStatus.TODO,
    priority: TaskPriority.URGENT,
    dueDate: daysFromNow(0),
    estimatedMinutes: 180,
    tags: ["security", "backend", "auth"],
  },
  {
    title: "Write integration tests for auth endpoints",
    description: "Cover login, register, refresh and logout flows with supertest against a real database.",
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.MEDIUM,
    startDate: daysFromNow(-5),
    dueDate: daysFromNow(-1),
    completedAt: daysFromNow(0),
    estimatedMinutes: 300,
    tags: ["testing", "auth", "backend"],
  },
  {
    title: "Optimize dashboard query performance",
    description: "Add compound indexes and cache aggregated metrics to reduce dashboard response latency.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueDate: daysFromNow(4),
    estimatedMinutes: 360,
    tags: ["backend", "performance", "dashboard"],
  },
  {
    title: "Add dark mode support",
    description: "Implement theme switching across the web app using CSS variables and persisted preference.",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueDate: daysFromNow(10),
    estimatedMinutes: 480,
    tags: ["ui", "frontend", "accessibility"],
  },
  {
    title: "Review pending pull requests",
    description: "Review and provide feedback on the five PRs currently open in the team repository.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    startDate: daysFromNow(-2),
    dueDate: daysFromNow(0),
    estimatedMinutes: 120,
    tags: ["collaboration", "code-review"],
  },
  {
    title: "Fix calendar drag-and-drop conflict bug",
    description: "Resolve overlapping event validation issue when dragging tasks onto conflicting time slots.",
    status: TaskStatus.TODO,
    priority: TaskPriority.URGENT,
    dueDate: daysFromNow(-1),
    estimatedMinutes: 150,
    tags: ["bug", "calendar", "frontend"],
  },
  {
    title: "Set up CI pipeline for the API",
    description: "Configure lint, type-check and test jobs to run on every pull request to the API package.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: daysFromNow(5),
    estimatedMinutes: 200,
    tags: ["devops", "ci", "infra"],
  },
  {
    title: "Write onboarding documentation",
    description: "Document local development setup, environment variables and architecture overview for new contributors.",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueDate: daysFromNow(21),
    estimatedMinutes: 240,
    tags: ["docs", "onboarding"],
  },
  {
    title: "Refactor voice module providers",
    description: "Extract shared audio utilities and unify provider interfaces in the speech synthesis module.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    startDate: daysFromNow(-3),
    dueDate: daysFromNow(6),
    estimatedMinutes: 420,
    tags: ["refactor", "voice", "backend"],
  },
];

async function ensureSampleOwner(): Promise<Types.ObjectId> {
  const existing = await UserModel.findOne({ email: SAMPLE_OWNER_EMAIL }).exec();
  if (existing) return existing._id;

  const password = await bcrypt.hash(SAMPLE_OWNER_PASSWORD, PASSWORD_SALT_ROUNDS);
  const user = await UserModel.create({
    firstName: "Demo",
    lastName: "User",
    email: SAMPLE_OWNER_EMAIL,
    password,
    role: UserRole.USER,
    isEmailVerified: true,
    isActive: true,
  });
  console.log(`Created sample owner user: ${SAMPLE_OWNER_EMAIL}`);
  return user._id;
}

async function seedSampleTasks(): Promise<void> {
  await connectDatabase();

  const ownerId = await ensureSampleOwner();

  const existingCount = await TaskModel.countDocuments({ owner: ownerId }).exec();
  if (existingCount > 0) {
    console.log(`Sample tasks already exist for ${SAMPLE_OWNER_EMAIL}; skipping.`);
    await disconnectDatabase();
    return;
  }

  const tasks = sampleTasks.map((task) => ({ ...task, owner: ownerId }));
  await TaskModel.insertMany(tasks);

  console.log(`Seeded ${tasks.length} sample tasks for ${SAMPLE_OWNER_EMAIL}.`);
  console.log(`Owner id: ${ownerId}`);
  console.log(`Login with ${SAMPLE_OWNER_EMAIL} / ${SAMPLE_OWNER_PASSWORD}`);

  await disconnectDatabase();
}

seedSampleTasks().catch((error) => {
  console.error("Failed to seed sample tasks:", error);
  process.exitCode = 1;
});
