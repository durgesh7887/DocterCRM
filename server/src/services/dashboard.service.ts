import { Types } from "mongoose";
import { Appointment } from "../models/Appointment.js";
import { Clinic } from "../models/Clinic.js";
import { Followup } from "../models/Followup.js";
import { Patient } from "../models/Patient.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import {
  DoctorClinicAssignment,
  ReceptionClinicAssignment,
} from "../models/ClinicAssignments.js";
import { Visit } from "../models/Visit.js";
import { classifyFollowupStatus } from "./followup.service.js";

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function endOfToday() {
  const start = startOfToday();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export async function superAdminDashboard() {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [
    totalClinics,
    activeClinics,
    inactiveClinics,
    totalPatients,
    totalDoctors,
    totalAdmins,
    totalReception,
    pendingFollowups,
    recentPayments,
    recentClinics,
  ] = await Promise.all([
    Clinic.countDocuments({ isDeleted: false }),
    Clinic.countDocuments({ isDeleted: false, status: "ACTIVE" }),
    Clinic.countDocuments({ isDeleted: false, status: "INACTIVE" }),
    Patient.countDocuments({ isDeleted: false }),
    User.countDocuments({ isDeleted: false, role: "DOCTOR" }),
    User.countDocuments({ isDeleted: false, role: "ADMIN" }),
    User.countDocuments({ isDeleted: false, role: "RECEPTION" }),
    Followup.countDocuments({
      isDeleted: false,
      status: { $in: ["UPCOMING", "DUE", "MISSED"] },
    }),
    Payment.find().sort({ createdAt: -1 }).limit(8).populate("clinicId", "name").lean(),
    Clinic.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(6).select("name status createdAt").lean(),
  ]);

  const [paidAgg, pendingAgg, overdueAgg] = await Promise.all([
    Payment.aggregate([{ $match: { status: "PAID" } }, { $group: { _id: null, total: { $sum: "$paidAmount" } } }]),
    Payment.countDocuments({ status: "PENDING" }),
    Payment.countDocuments({ status: "OVERDUE" }),
  ]);

  return {
    totalClinics,
    activeClinics,
    inactiveClinics,
    totalPatients,
    totalDoctors,
    totalAdmins,
    totalReception,
    pendingFollowups,
    todayRange: { todayStart, todayEnd },
    revenue: {
      total: paidAgg[0]?.total ?? 0,
      pendingPayments: pendingAgg,
      overduePayments: overdueAgg,
    },
    recentPayments,
    recentClinics,
  };
}

export async function clinicDashboard(clinicId: Types.ObjectId) {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const filter = { clinicId, isDeleted: false };

  const [
    totalPatients,
    todayPatients,
    todayAppointments,
    pendingAppointments,
    todayFollowups,
    doctors,
    receptionStaff,
  ] = await Promise.all([
    Patient.countDocuments(filter),
    Visit.countDocuments({ ...filter, visitDate: { $gte: todayStart, $lt: todayEnd } }),
    Appointment.countDocuments({ ...filter, appointmentDate: { $gte: todayStart, $lt: todayEnd } }),
    Appointment.countDocuments({ ...filter, status: { $in: ["SCHEDULED", "CONFIRMED"] } }),
    Followup.countDocuments({ ...filter, followupDate: { $gte: todayStart, $lt: todayEnd } }),
    DoctorClinicAssignment.countDocuments({ clinicId, isDeleted: false, status: "ACTIVE" }),
    ReceptionClinicAssignment.countDocuments({ clinicId, isDeleted: false, status: "ACTIVE" }),
  ]);

  return {
    totalPatients,
    todayPatients,
    todayAppointments,
    pendingAppointments,
    todayFollowups,
    doctors,
    receptionStaff,
  };
}

export async function followupMetrics(clinicId: Types.ObjectId) {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const filter = { clinicId, isDeleted: false };

  const [today, pending, overdue, completed] = await Promise.all([
    Followup.countDocuments({ ...filter, followupDate: { $gte: todayStart, $lt: todayEnd } }),
    Followup.countDocuments({ ...filter, status: { $in: ["UPCOMING", "DUE"] } }),
    Followup.countDocuments({ ...filter, status: "MISSED" }),
    Followup.countDocuments({ ...filter, status: "COMPLETED" }),
  ]);

  return { today, pending, overdue, completed };
}

export { classifyFollowupStatus };
