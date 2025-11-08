import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, default: "TODO" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  priority: String,
  deadline: Date,
  helpfulNotes: String, //extra notes from AI/agent.
  relatedSkills: [String], //used for matching agents to tickets.
  moderatorMessage: {
    type: String,
    default: "",
  },
  createdAt: { type: Date, default: Date.now },
});

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
