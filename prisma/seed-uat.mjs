import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for seed:uat");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function findOrCreateSchedule({ classId, subjectId, day, startTime, endTime }) {
  const existing = await prisma.schedule.findFirst({
    where: { classId, subjectId, day, startTime, endTime },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.schedule.create({
    data: { classId, subjectId, day, startTime, endTime },
    select: { id: true },
  });
}

async function main() {
  const school = await prisma.school.upsert({
    where: { code: "KMC" },
    update: {
      name: "Knightdale Middle College",
      email: "admin@kmc.edu.ng",
      phone: "+2347000000000",
      address: "KMC Campus",
    },
    create: {
      code: "KMC",
      name: "Knightdale Middle College",
      email: "admin@kmc.edu.ng",
      phone: "+2347000000000",
      address: "KMC Campus",
    },
  });

  await prisma.session.updateMany({
    where: { schoolId: school.id, isCurrent: true },
    data: { isCurrent: false },
  });

  const session = await prisma.session.upsert({
    where: { name_schoolId: { name: "2026/2027", schoolId: school.id } },
    update: {
      isCurrent: true,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-07-31"),
    },
    create: {
      name: "2026/2027",
      schoolId: school.id,
      isCurrent: true,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-07-31"),
    },
  });

  await prisma.term.updateMany({
    where: { sessionId: session.id, isCurrent: true },
    data: { isCurrent: false },
  });

  const firstTerm = await prisma.term.upsert({
    where: { name_sessionId: { name: "FIRST", sessionId: session.id } },
    update: {
      isCurrent: true,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-18"),
    },
    create: {
      name: "FIRST",
      sessionId: session.id,
      isCurrent: true,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-18"),
    },
  });

  await prisma.term.upsert({
    where: { name_sessionId: { name: "SECOND", sessionId: session.id } },
    update: {
      isCurrent: false,
      startDate: new Date("2027-01-12"),
      endDate: new Date("2027-04-08"),
    },
    create: {
      name: "SECOND",
      sessionId: session.id,
      isCurrent: false,
      startDate: new Date("2027-01-12"),
      endDate: new Date("2027-04-08"),
    },
  });

  await prisma.term.upsert({
    where: { name_sessionId: { name: "THIRD", sessionId: session.id } },
    update: {
      isCurrent: false,
      startDate: new Date("2027-04-27"),
      endDate: new Date("2027-07-31"),
    },
    create: {
      name: "THIRD",
      sessionId: session.id,
      isCurrent: false,
      startDate: new Date("2027-04-27"),
      endDate: new Date("2027-07-31"),
    },
  });

  const adminPasswordHash = await bcrypt.hash("KMC-ADMIN01", 10);
  const admin = await prisma.user.upsert({
    where: { accessId: "KMC-ADMIN01" },
    update: {
      passwordHash: adminPasswordHash,
      firstName: "System",
      lastName: "Admin",
      email: "admin@kmc.edu.ng",
      role: "ADMIN",
      schoolId: school.id,
    },
    create: {
      accessId: "KMC-ADMIN01",
      passwordHash: adminPasswordHash,
      firstName: "System",
      lastName: "Admin",
      email: "admin@kmc.edu.ng",
      role: "ADMIN",
      schoolId: school.id,
    },
    select: { id: true },
  });

  const teacherPasswordHash = await bcrypt.hash("KMC-TCH001", 10);
  const teacherUser = await prisma.user.upsert({
    where: { accessId: "KMC-TCH001" },
    update: {
      passwordHash: teacherPasswordHash,
      firstName: "Ada",
      lastName: "Okafor",
      role: "TEACHER",
      schoolId: school.id,
      teacherProfile: {
        upsert: {
          update: {
            qualification: "B.Ed Mathematics",
            specialization: "Mathematics",
          },
          create: {
            qualification: "B.Ed Mathematics",
            specialization: "Mathematics",
          },
        },
      },
    },
    create: {
      accessId: "KMC-TCH001",
      passwordHash: teacherPasswordHash,
      firstName: "Ada",
      lastName: "Okafor",
      role: "TEACHER",
      schoolId: school.id,
      teacherProfile: {
        create: {
          qualification: "B.Ed Mathematics",
          specialization: "Mathematics",
        },
      },
    },
    include: {
      teacherProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  const schoolClass = await prisma.class.upsert({
    where: {
      name_schoolId: {
        name: "JSS 1A",
        schoolId: school.id,
      },
    },
    update: {
      level: "JSS1",
      classTeacherId: teacherUser.teacherProfile.id,
    },
    create: {
      name: "JSS 1A",
      level: "JSS1",
      schoolId: school.id,
      classTeacherId: teacherUser.teacherProfile.id,
    },
  });

  const studentSeeds = [
    { accessId: "KMC-STD001", firstName: "Chidera", lastName: "Ibrahim", gender: "FEMALE" },
    { accessId: "KMC-STD002", firstName: "Ikenna", lastName: "Bello", gender: "MALE" },
  ];

  const students = [];
  for (const item of studentSeeds) {
    const passwordHash = await bcrypt.hash(item.accessId, 10);
    const user = await prisma.user.upsert({
      where: { accessId: item.accessId },
      update: {
        passwordHash,
        firstName: item.firstName,
        lastName: item.lastName,
        role: "STUDENT",
        schoolId: school.id,
        gender: item.gender,
        studentProfile: {
          upsert: {
            update: {
              classId: schoolClass.id,
              parentName: "Guardian",
              parentPhone: "+2347011111111",
            },
            create: {
              classId: schoolClass.id,
              parentName: "Guardian",
              parentPhone: "+2347011111111",
            },
          },
        },
      },
      create: {
        accessId: item.accessId,
        passwordHash,
        firstName: item.firstName,
        lastName: item.lastName,
        role: "STUDENT",
        schoolId: school.id,
        gender: item.gender,
        studentProfile: {
          create: {
            classId: schoolClass.id,
            parentName: "Guardian",
            parentPhone: "+2347011111111",
          },
        },
      },
      include: {
        studentProfile: {
          select: {
            id: true,
          },
        },
      },
    });
    students.push(user.studentProfile);
  }

  const subject = await prisma.subject.upsert({
    where: { name_classId: { name: "Mathematics", classId: schoolClass.id } },
    update: { code: "MTH-101", schoolId: school.id },
    create: {
      name: "Mathematics",
      code: "MTH-101",
      classId: schoolClass.id,
      schoolId: school.id,
    },
  });

  await prisma.subjectTeacher.upsert({
    where: {
      subjectId_teacherId: {
        subjectId: subject.id,
        teacherId: teacherUser.teacherProfile.id,
      },
    },
    update: {},
    create: {
      subjectId: subject.id,
      teacherId: teacherUser.teacherProfile.id,
    },
  });

  await findOrCreateSchedule({
    classId: schoolClass.id,
    subjectId: subject.id,
    day: "MONDAY",
    startTime: "08:00",
    endTime: "08:45",
  });
  await findOrCreateSchedule({
    classId: schoolClass.id,
    subjectId: subject.id,
    day: "WEDNESDAY",
    startTime: "09:30",
    endTime: "10:15",
  });

  let exam = await prisma.exam.findFirst({
    where: {
      title: "UAT Mathematics Benchmark",
      subjectId: subject.id,
      classId: schoolClass.id,
      termId: firstTerm.id,
      teacherId: teacherUser.teacherProfile.id,
    },
    select: { id: true },
  });

  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        title: "UAT Mathematics Benchmark",
        type: "CBT",
        subjectId: subject.id,
        classId: schoolClass.id,
        teacherId: teacherUser.teacherProfile.id,
        termId: firstTerm.id,
        duration: 30,
        totalMarks: 20,
        passingMarks: 10,
        instructions: "UAT seeded exam",
        isPublished: true,
        isProctoringEnabled: true,
        isWebcamRequired: false,
        maxViolations: 3,
        shuffleQuestions: true,
        startTime: new Date(),
      },
      select: { id: true },
    });
  }

  const existingQuestions = await prisma.examQuestion.findMany({
    where: { examId: exam.id },
    select: { id: true, order: true },
  });

  if (existingQuestions.length === 0) {
    await prisma.examQuestion.createMany({
      data: [
        {
          examId: exam.id,
          questionText: "2 + 2 = ?",
          questionType: "MCQ",
          options: ["2", "3", "4", "5"],
          correctAnswer: "4",
          marks: 10,
          order: 1,
        },
        {
          examId: exam.id,
          questionText: "3 x 3 = ?",
          questionType: "MCQ",
          options: ["6", "8", "9", "12"],
          correctAnswer: "9",
          marks: 10,
          order: 2,
        },
      ],
    });
  }

  const questions = await prisma.examQuestion.findMany({
    where: { examId: exam.id },
    orderBy: { order: "asc" },
    select: { id: true, correctAnswer: true, marks: true },
  });

  const primaryStudentId = students[0].id;
  const submission = await prisma.examSubmission.upsert({
    where: {
      examId_studentId: {
        examId: exam.id,
        studentId: primaryStudentId,
      },
    },
    update: {
      submittedAt: new Date(),
      totalScore: 20,
      percentage: 100,
    },
    create: {
      examId: exam.id,
      studentId: primaryStudentId,
      submittedAt: new Date(),
      totalScore: 20,
      percentage: 100,
    },
  });

  for (const question of questions) {
    await prisma.examAnswer.upsert({
      where: {
        submissionId_questionId: {
          submissionId: submission.id,
          questionId: question.id,
        },
      },
      update: {
        answer: question.correctAnswer ?? "",
        isCorrect: true,
        marksObtained: question.marks,
      },
      create: {
        submissionId: submission.id,
        questionId: question.id,
        answer: question.correctAnswer ?? "",
        isCorrect: true,
        marksObtained: question.marks,
      },
    });
  }

  await prisma.result.upsert({
    where: {
      studentId_subjectId_termId: {
        studentId: primaryStudentId,
        subjectId: subject.id,
        termId: firstTerm.id,
      },
    },
    update: {
      examScore: 20,
      totalScore: 85,
      grade: "A",
      remark: "Excellent",
    },
    create: {
      studentId: primaryStudentId,
      subjectId: subject.id,
      termId: firstTerm.id,
      firstCA: 15,
      secondCA: 15,
      midTermTest: 15,
      assignment: 10,
      project: 10,
      examScore: 20,
      totalScore: 85,
      grade: "A",
      remark: "Excellent",
    },
  });

  let fee = await prisma.fee.findFirst({
    where: {
      schoolId: school.id,
      termId: firstTerm.id,
      name: "UAT School Fees",
    },
    select: { id: true },
  });

  if (!fee) {
    fee = await prisma.fee.create({
      data: {
        schoolId: school.id,
        termId: firstTerm.id,
        name: "UAT School Fees",
        amount: 50000,
        description: "Seeded UAT fee definition",
      },
      select: { id: true },
    });
  }

  const existingPayment = await prisma.payment.findFirst({
    where: { reference: "UAT-PAY-001" },
    select: { id: true },
  });

  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        studentId: primaryStudentId,
        feeId: fee.id,
        amount: 30000,
        status: "PARTIAL",
        method: "bank transfer",
        reference: "UAT-PAY-001",
        paidAt: new Date(),
      },
    });
  }

  const existingAnnouncement = await prisma.announcement.findFirst({
    where: {
      schoolId: school.id,
      title: "UAT Welcome Notice",
    },
    select: { id: true },
  });

  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        schoolId: school.id,
        authorId: admin.id,
        classId: schoolClass.id,
        title: "UAT Welcome Notice",
        content: "This announcement is seeded for UAT walkthrough validation.",
        priority: 1,
        isActive: true,
      },
    });
  }

  console.info("UAT seed complete.");
  console.info(
    JSON.stringify(
      {
        schoolCode: "KMC",
        adminAccessId: "KMC-ADMIN01",
        teacherAccessId: "KMC-TCH001",
        studentAccessIds: studentSeeds.map((entry) => entry.accessId),
        className: "JSS 1A",
        subject: "Mathematics",
        examTitle: "UAT Mathematics Benchmark",
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("UAT seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
