import { Service } from "../models/Service.js";
import { Doctor } from "../models/Doctor.js";
import { User } from "../models/User.js";
import { doctorCatalog } from "../data/doctorCatalog.js";

const defaultServices = [
  {
    title: "AI Health Screening",
    description:
      "Sàng lọc triệu chứng ban đầu bằng AI, đưa ra gợi ý chăm sóc và mức độ ưu tiên khám.",
    durationMinutes: 30,
    price: 199000,
    icon: "Stethoscope",
  },
  {
    title: "Nutrition Consultation",
    description:
      "Tư vấn dinh dưỡng cá nhân hóa theo mục tiêu giảm cân, tăng cơ hoặc kiểm soát đường huyết.",
    durationMinutes: 45,
    price: 349000,
    icon: "Apple",
  },
  {
    title: "Mental Wellness Session",
    description:
      "Hỗ trợ sức khỏe tinh thần với chuyên gia, theo dõi stress và thói quen ngủ.",
    durationMinutes: 50,
    price: 399000,
    icon: "Brain",
  },
  {
    title: "General Consultation",
    description:
      "Khám tổng quát với bác sĩ để tư vấn lộ trình điều trị và theo dõi sức khỏe.",
    durationMinutes: 30,
    price: 500000,
    icon: "Stethoscope",
  },
];

const seedServicesIfNeeded = async () => {
  try {
    const count = await Service.countDocuments();
    console.log("Current services count:", count);
    if (count === 0) {
      await Service.insertMany(defaultServices);
      console.log("Default services seeded");
    }
  } catch (error) {
    console.error("Error seeding services:", error.message);
  }
};

const seedDoctorsIfNeeded = async () => {
  let added = 0;
  let updated = 0;
  for (const [index, doctor] of doctorCatalog.entries()) {
    const doctorPayload =
      index === 0
        ? {
            ...doctor,
            account: {
              username: "doctor",
              email: "doctor@healthyai.vn",
              phone: "0908765432",
              tempPassword: "123456",
              isActive: true,
              updatedAt: new Date(),
            },
          }
        : doctor;
    const exists = await Doctor.findOne({
      fullName: doctorPayload.fullName,
      hospital: doctorPayload.hospital,
    });
    if (!exists) {
      await Doctor.create(doctorPayload);
      added += 1;
      continue;
    }

    const needsUpdate =
      !exists.avatarUrl ||
      exists.avatarUrl !== doctorPayload.avatarUrl ||
      exists.avatarColor !== doctorPayload.avatarColor ||
      exists.specialty !== doctorPayload.specialty ||
      exists.title !== doctorPayload.title ||
      exists.hospital !== doctorPayload.hospital ||
      exists.bio !== doctorPayload.bio ||
      Number(exists.experienceYears) !== Number(doctorPayload.experienceYears) ||
      Number(exists.rating) !== Number(doctorPayload.rating) ||
      (index === 0 && !exists.account?.email);

    if (needsUpdate) {
      exists.title = doctorPayload.title;
      exists.specialty = doctorPayload.specialty;
      exists.experienceYears = doctorPayload.experienceYears;
      exists.rating = doctorPayload.rating;
      exists.bio = doctorPayload.bio;
      exists.avatarColor = doctorPayload.avatarColor;
      exists.avatarUrl = doctorPayload.avatarUrl || exists.avatarUrl || "";
      exists.timeSlots = doctorPayload.timeSlots;
      if (doctorPayload.account && !exists.account?.email) {
        exists.account = doctorPayload.account;
      }
      await exists.save();
      updated += 1;
    }
  }
  if (added > 0) {
    console.log(`Default doctors seeded: +${added}`);
  }
  if (updated > 0) {
    console.log(`Default doctors updated: ${updated}`);
  }
};

const seedAdminIfNeeded = async () => {
  try {
    const adminEmail = "admin@booking.com";
    const doctorEmail = "doctor@healthyai.com";
    
    // Delete ALL admin/doctor test accounts
    const deleted = await User.deleteMany({ email: { $in: [adminEmail, "admin@healthyai.vn", doctorEmail] } });
    console.log("Deleted admin/doctor accounts:", deleted.deletedCount);
    
    // Create fresh admin account
    const admin = await User.create({
      fullName: "Admin",
      email: adminEmail,
      password: "Admin123!@#",
      role: "admin",
    });
    console.log("Admin created with ID:", admin._id);
    
    // Create fresh doctor test account
    const doctor = await User.create({
      fullName: "BS. Nguyễn Văn A",
      email: doctorEmail,
      password: "Doctor123!@#",
      role: "doctor",
      specialty: "Nội tổng quát",
      hospital: "Bệnh viện Đà Nẵng",
      phone: "0908765432",
    });
    console.log("Doctor test account created:", doctor._id);
    
    console.log("Admin & Doctor accounts recreated with new credentials");
  } catch (error) {
    console.error("Error seeding admin/doctor:", error.message);
  }
};

export const runSeeders = async () => {
  await seedServicesIfNeeded();
  await seedDoctorsIfNeeded();
  await seedAdminIfNeeded();
};
