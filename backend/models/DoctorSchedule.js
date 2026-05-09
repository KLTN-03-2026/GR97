import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  slotLabel: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  isBooked: { type: Boolean, default: false },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
});

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    workingDays: {
      type: [String],
      default: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },
    workingHours: {
      start: { type: String, default: "08:00" },
      end: { type: String, default: "17:00" },
    },
    breakTime: {
      start: { type: String, default: "12:00" },
      end: { type: String, default: "13:30" },
    },
    slotDuration: { type: Number, default: 30 }, // minutes
    timeSlots: [timeSlotSchema],
    exceptions: [{
      date: { type: Date },
      isOff: { type: Boolean, default: false },
      customSlots: [{ type: String }],
    }],
  },
  { timestamps: true }
);

// Auto generate time slots for next 30 days
doctorScheduleSchema.methods.generateSlotsForDate = async function (date) {
  const slots = [];
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "lowercase" });
  
  // Check if doctor works this day
  if (!this.workingDays.includes(dayOfWeek)) {
    return slots;
  }

  // Check exception for this date
  const exception = this.exceptions.find(e => 
    new Date(e.date).toDateString() === date.toDateString()
  );
  
  if (exception?.isOff) {
    return slots;
  }

  let currentTime = new Date(date);
  const [startHour, startMin] = this.workingHours.start.split(":").map(Number);
  const [endHour, endMin] = this.workingHours.end.split(":").map(Number);
  const [breakStartHour, breakStartMin] = this.breakTime.start.split(":").map(Number);
  const [breakEndHour, breakEndMin] = this.breakTime.end.split(":").map(Number);

  currentTime.setHours(startHour, startMin, 0, 0);
  const endTime = new Date(date);
  endTime.setHours(endHour, endMin, 0, 0);
  const breakStart = new Date(date);
  breakStart.setHours(breakStartHour, breakStartMin, 0, 0);
  const breakEnd = new Date(date);
  breakEnd.setHours(breakEndHour, breakEndMin, 0, 0);

  while (currentTime < endTime) {
    // Skip break time
    if (currentTime >= breakStart && currentTime < breakEnd) {
      currentTime = new Date(breakEnd.getTime());
      continue;
    }

    const slotEndTime = new Date(currentTime.getTime() + this.slotDuration * 60000);
    
    if (slotEndTime > endTime) break;

    const slotLabel = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')} - ${slotEndTime.getHours().toString().padStart(2, '0')}:${slotEndTime.getMinutes().toString().padStart(2, '0')}`;
    
    slots.push({
      date: new Date(date),
      slotLabel,
      startTime: currentTime.toTimeString().slice(0, 5),
      endTime: slotEndTime.toTimeString().slice(0, 5),
      isAvailable: true,
      isBooked: false,
    });

    currentTime = slotEndTime;
  }

  return slots;
};

doctorScheduleSchema.methods.isSlotAvailable = function (date, slotLabel) {
  const slot = this.timeSlots.find(s => 
    new Date(s.date).toDateString() === new Date(date).toDateString() && 
    s.slotLabel === slotLabel
  );
  
  return slot && slot.isAvailable && !slot.isBooked;
};

doctorScheduleSchema.methods.bookSlot = async function (date, slotLabel, appointmentId) {
  const slotIndex = this.timeSlots.findIndex(s => 
    new Date(s.date).toDateString() === new Date(date).toDateString() && 
    s.slotLabel === slotLabel
  );

  if (slotIndex === -1) return false;
  
  const slot = this.timeSlots[slotIndex];
  if (!slot.isAvailable || slot.isBooked) return false;

  this.timeSlots[slotIndex].isBooked = true;
  this.timeSlots[slotIndex].appointmentId = appointmentId;
  await this.save();
  
  return true;
};

doctorScheduleSchema.methods.releaseSlot = async function (date, slotLabel) {
  const slotIndex = this.timeSlots.findIndex(s => 
    new Date(s.date).toDateString() === new Date(date).toDateString() && 
    s.slotLabel === slotLabel
  );

  if (slotIndex === -1) return false;

  this.timeSlots[slotIndex].isBooked = false;
  this.timeSlots[slotIndex].appointmentId = null;
  await this.save();
  
  return true;
};

export const DoctorSchedule = mongoose.model("DoctorSchedule", doctorScheduleSchema);
