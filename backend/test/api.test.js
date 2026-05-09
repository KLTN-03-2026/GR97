import request from "supertest";
import { expect } from "chai";

process.env.IN_MEMORY_AUTH = "1";
process.env.NODE_ENV = "test";

const { default: app } = await import("../app.js");

describe("API Tests", () => {
  let patientToken;
  let doctorToken;
  let doctorId;
  let appointmentId;

  describe("Health Check", () => {
    it("should return server status", async () => {
      const res = await request(app)
        .get("/api/health")
        .expect(200);

      expect(res.body).to.have.property("status", "ok");
      expect(res.body).to.have.property("timestamp");
    });
  });

  describe("Authentication", () => {
    it("should reject invalid login", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ identifier: "invalid", password: "invalid" })
        .expect(401);

      expect(res.body).to.have.property("message");
    });

    it("should login a seeded patient", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ identifier: "leducvinh188@gmail.com", password: "123456Aa!" })
        .expect(200);

      expect(res.body).to.have.property("token");
      expect(res.body.user).to.include({ role: "patient" });
      patientToken = res.body.token;
    });

    it("should return the current authenticated user", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.user).to.include({ role: "patient" });
    });
  });

  describe("Appointments", () => {
    it("should require authentication", async () => {
      const res = await request(app)
        .get("/api/appointments/me")
        .expect(401);

      expect(res.body).to.have.property("message");
    });

    it("should list doctors for booking", async () => {
      const res = await request(app).get("/api/doctors").expect(200);

      expect(res.body.doctors).to.be.an("array").that.is.not.empty;
      doctorId = res.body.doctors[0]._id;
      expect(doctorId).to.be.a("string");
    });

    it("should book a future appointment with a doctor", async () => {
      const appointmentAt = new Date();
      appointmentAt.setDate(appointmentAt.getDate() + 3);
      appointmentAt.setHours(8, 0, 0, 0);

      const res = await request(app)
        .post(`/api/doctors/${doctorId}/book`)
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          slotLabel: "08:00",
          appointmentAt: appointmentAt.toISOString(),
          notes: "Test booking flow",
        })
        .expect(201);

      expect(res.body.appointment).to.include({ status: "pending", paymentStatus: "pending" });
      expect(res.body.payment).to.have.property("bookingCode");
      appointmentId = res.body.appointment._id;
    });

    it("should list the patient's appointments", async () => {
      const res = await request(app)
        .get("/api/appointments/me")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.appointments.map((item) => item._id)).to.include(appointmentId);
    });

    it("should mark a booking as paid", async () => {
      const res = await request(app)
        .patch(`/api/doctors/bookings/${appointmentId}/pay`)
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.appointment).to.include({ status: "confirmed", paymentStatus: "paid" });
    });

    it("should allow doctor portal login and appointment status update", async () => {
      const login = await request(app)
        .post("/api/doctor-portal/login")
        .send({ identifier: "doctor@healthyai.vn", password: "123456" })
        .expect(200);

      expect(login.body).to.have.property("token");
      doctorToken = login.body.token;

      const list = await request(app)
        .get("/api/doctor-portal/appointments")
        .set("Authorization", `Bearer ${doctorToken}`)
        .expect(200);
      expect(list.body.appointments.map((item) => item._id)).to.include(appointmentId);

      const update = await request(app)
        .patch(`/api/doctor-portal/appointments/${appointmentId}/status`)
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({ status: "completed" })
        .expect(200);
      expect(update.body.appointment).to.include({ status: "completed" });
    });
  });

  describe("Medical Records", () => {
    it("should list seeded medical records", async () => {
      const res = await request(app)
        .get("/api/records/me")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.records).to.be.an("array").that.is.not.empty;
    });

    it("should create and export medical records", async () => {
      await request(app)
        .post("/api/records")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          visitDate: new Date().toISOString(),
          hospital: "HealthyAI Clinic",
          doctorName: "BS. Test",
          specialty: "Noi tong quat",
          diagnosis: "Kiem tra dinh ky",
          summary: "Suc khoe on dinh",
          symptoms: ["Met moi nhe"],
          recommendations: ["Ngu du giac"],
          prescriptions: [],
          files: [],
        })
        .expect(201);

      const exported = await request(app)
        .get("/api/records/export?format=json")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(exported.body.records).to.be.an("array").that.is.not.empty;
    });
  });

  describe("Video Calls", () => {
    it("should create a video room for a doctor call", async () => {
      const res = await request(app)
        .post("/api/video/create-room")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          doctorId,
          appointmentId,
          patientName: "Le Duc Vinh",
        })
        .expect(200);

      expect(res.body.room).to.include({ doctorId, appointmentId, status: "waiting" });
      expect(res.body.room.roomId).to.match(/^video_/);
    });
  });
});
