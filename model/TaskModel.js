const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.String ,ref: 'User' },
    date: { type: Date, required: true },
    task: { type: String, required: true },
    status: { type: String, enum: ['Completed', 'Incomplete'], required: true },
    taskId: { type :Number , required: true}
  });
 mongoose.model('Task', taskSchema);
  module.exports=mongoose.model("Task");