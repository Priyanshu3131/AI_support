import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-create", retries: 0 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      // ✅ STEP 1: Fetch ticket
      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId);
        if (!ticketObject) {
          throw new NonRetriableError("Ticket not found");
        }
        return ticketObject;
      });

      // ✅ STEP 2: Initial status
      await step.run("update-ticket-status", async () => {
        await Ticket.findByIdAndUpdate(ticketId, { status: "TODO" });
      });

      // ✅ STEP 3: AI CALL (NO step inside analyzeTicket)
      const aiResponse = await analyzeTicket(ticket);

      // ✅ STEP 4: Process AI result
      const relatedSkills = await step.run("ai-processing", async () => {
        let skills = [];

        if (aiResponse) {
          const priority = aiResponse.priority?.toLowerCase();

          await Ticket.findByIdAndUpdate(ticketId, {
            priority: ["low", "medium", "high"].includes(priority)
              ? priority
              : "medium",
            helpfulNotes: aiResponse.helpfulNotes || "", // ✅ FIXED
            status: "IN_PROGRESS",
            relatedSkills: aiResponse.relatedSkills || [],
          });

          skills = aiResponse.relatedSkills || [];
        }

        return skills;
      });

      // ✅ STEP 5: Assign moderator
      const moderator = await step.run("assign-moderator", async () => {
        let user = await User.findOne({
          role: "moderator",
          skills: {
            $elemMatch: {
              $regex: relatedSkills.join("|"),
              $options: "i",
            },
          },
        });

        if (!user) {
          user = await User.findOne({ role: "admin" });
        }

        await Ticket.findByIdAndUpdate(ticketId, {
          assignedTo: user?._id || null,
        });

        return user;
      });

      // ✅ STEP 6: Send email
      await step.run("send-notification", async () => {
        if (!moderator) return;

        const finalTicket = await Ticket.findById(ticketId);

        await sendMail(
          moderator.email,
          `New Ticket Assigned: ${finalTicket.title}`,
          `Hello ${moderator.name},

A new ticket has been assigned to you:

Title: ${finalTicket.title}
Description: ${finalTicket.description}
Priority: ${finalTicket.priority}

Please check the ticket and take necessary actions.

Best regards,
Ticketing System Team`
        );
      });

      return { success: true };

    } catch (error) {
      console.error("❌ Error creating ticket:", error.message);
      throw error;
    }
  }
);



// import { inngest } from "../client.js";
// import Ticket from "../../models/ticket.js";
// import User from "../../models/user.js";
// import { NonRetriableError } from "inngest";
// import { sendMail } from "../../utils/mailer.js";
// import analyzeTicket from "../../utils/ai.js";
// export const onTicketCreated = inngest.createFunction(
//   { id: "on-ticket-create", retries: 1 },   // reduce retries
//   { event: "ticket/created" },
//   async ({ event, step }) => {
//     try {
//       const { ticketId } = event.data;

//       const ticket = await step.run("fetch-ticket", async () => {
//         const ticketObject = await Ticket.findById(ticketId);
//         if (!ticketObject) {
//           throw new NonRetriableError("Ticket not found");
//         }
//         return ticketObject;
//       });

//       await step.run("update-ticket-status", async () => {
//         await Ticket.findByIdAndUpdate(ticketId, { status: "TODO" });
//       });

//       // ✅ AI CALL — NOT inside step.run
//       const aiResponse = await analyzeTicket(ticket);

//       const relatedSkills = await step.run("ai-processing", async () => {
//         let skills = [];

//         if (aiResponse) {
//           await Ticket.findByIdAndUpdate(ticketId, {
//             priority: ["low","medium","high"].includes(
//               aiResponse.priority?.toLowerCase()
//             )
//               ? aiResponse.priority.toLowerCase()
//               : "medium",
//             helpfulNotes: aiResponse.helpfulNotes || [],
//             status: "IN_PROGRESS",
//             relatedSkills: aiResponse.relatedSkills || [],
//           });

//           skills = aiResponse.relatedSkills || [];
//         }

//         return skills;
//       });

//       const moderator = await step.run("assign-moderator", async () => {
//         let user = await User.findOne({
//           role: "moderator",
//           skills: {
//             $elemMatch: {
//               $regex: relatedSkills.join("|"),
//               $options: "i",
//             },
//           },
//         });

//         if (!user) user = await User.findOne({ role: "admin" });

//         await Ticket.findByIdAndUpdate(ticketId, {
//           assignedTo: user?._id || null,
//         });

//         return user;
//       });

//       await step.run("send-notification", async () => {
//         if (!moderator) return;

//         const finalTicket = await Ticket.findById(ticketId);

//         await sendMail(
//           moderator.email,
//           `New Ticket Assigned: ${finalTicket.title}`,
//           `Hello ${moderator.name}...`
//         );
//       });

//       return { success: true };

//     } catch (error) {
//       console.error("❌ Error creating ticket:", error.message);
//       throw error; // ✅ let Inngest handle retry logic properly
//     }
//   }
// );




// import { inngest } from "../client.js";
// import Ticket from "../../models/ticket.js";
// import User from "../../models/user.js";
// import { NonRetriableError } from "inngest";
// import { sendMail } from "../../utils/mailer.js";
// import analyzeTicket from "../../utils/ai.js";

// export const onTicketCreated = inngest.createFunction(
//   {id: "on-ticket-create", retries: 2},
//   { event: "ticket/created" },
//   async ({ event, step }) => {
//     try {
//         const { ticketId} = event.data;
//         const ticket = await step.run("fetch-ticket", async () => {
//             const ticketObject = await Ticket.findById(ticketId);
//             if (!ticketObject) {
//                 throw new NonRetriableError("Ticket not found");
//             }
//             return ticketObject;
//         });

//        await step.run("update-ticket-status", async () => {
//            await Ticket.findOneAndUpdate(
//                { _id: ticketId },   
//                { status: "TODO" },
//                { new: true }
//            );
//        });

//        //const aiResponse = await analyzeTicket(ticket);
//        const aiResponse = await step.run("analyze-ticket-ai", async () => {
//             return await analyzeTicket(ticket);
//         });


//        const relatedSkills = await step.run("ai-processing", async () => { 
//             let skills = []
//             if (aiResponse) {
//                await Ticket.findByIdAndUpdate(ticketId, {
//                    priority:["low", "medium", "high"].includes(aiResponse.priority) ? aiResponse.priority : "medium",
//                    helpfulNotes: aiResponse.helpfulNotes ? aiResponse.helpfulNotes : [],
//                    status: "IN_PROGRESS",
//                    relatedSkills: aiResponse.relatedSkills ? aiResponse.relatedSkills : [],
//                })

//                skills = aiResponse.relatedSkills || [];
//            }

//            return skills
//        });

//        const moderator = await step.run("assign-moderator", async () => {
//            let user = await  User.findOne({
//             role: "moderator",
//             skills: {
//                 $elemMatch: {
//                     $regex: relatedSkills.join("|"),
//                     $options: "i",
//                 },
//             },
//            });

//            if(!user){
//             user = await User.findOne({ role: "admin" });
//            }

//            await Ticket.findByIdAndUpdate(ticketId, {
//                assignedTo: user?._id || null,
//            });

//            return user;
//        });

//        await step.run("send-notification", async () => {
//            if (moderator) {
//                const finalTicket = await Ticket.findById(ticket._id);
               
//                const subject = `New Ticket Assigned: ${finalTicket.title}`;
//                const message = `Hello ${moderator.name},\n\nA new ticket has been assigned to you:\n\nTitle: ${finalTicket.title}\nDescription: ${finalTicket.description}\nPriority: ${finalTicket.priority}\n\nPlease check the ticket and take necessary actions.\n\nBest regards,\nTicketing System Team`;

//                await sendMail(moderator.email, subject, message);
//            }
//        });

//        return {success : true}
       
//     } catch (error) {
//       console.error(`❌ Error creating ticket: ${error.message}`);
//       return { success: false };
//     }
//   }
// );