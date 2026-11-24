import mongoose from "mongoose";
const card = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true, maxlength: 240 },
    assignee: { type: String, default: "" },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    due: { type: String, default: "" },
    start: { type: String, default: "" },
    location: { type: String, default: "", maxlength: 160 },
    latitude: { type: String, default: "" },
    longitude: { type: String, default: "" },
    coverColor: { type: String, default: "" },
    coverImageId: { type: String, default: "" },
    labels: [String],
    archived: { type: Boolean, default: false },
    checklist: [
      {
        id: String,
        text: { type: String, maxlength: 500 },
        done: Boolean,
        due: { type: String, default: "" },
        assignee: { type: String, default: "" },
        _id: false,
      },
    ],
    dependencies: [Number],
    fields: { type: Map, of: String },
    source: String,
    detail: { type: String, maxlength: 5000, default: "" },
    checks: { type: Number, min: 0, default: 0 },
    done: { type: Number, min: 0, default: 0 },
    completed: { type: Boolean, default: false },
    cover: { type: String, enum: ["welcome", "capture", "shape"] },
  },
  { _id: false },
);
const list = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    title: { type: String, required: true, maxlength: 80 },
    color: {
      type: String,
      enum: ["neutral","lav","lilac","violet","plum","pink","rose","coral","red","peach","orange","yellow","lemon","mint","sage","teal","blue","sky","slate","sand"],
      default: "lav",
    },
    cards: { type: [card], default: [] },
    pinned: { type: Boolean, default: false },
    watchers: [String],
    archived: { type: Boolean, default: false },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, maxlength: 80 },
    subtitle: { type: String, maxlength: 200, default: "" },
    template: {
      type: String,
      enum: ["study", "scrum", "blank", "custom"],
      default: "blank",
    },
    lists: { type: [list], default: [] },
    visibility: {
      type: String,
      enum: ["Workspace", "Private"],
      default: "Workspace",
    },
    members: [String],
    archived: { type: Boolean, default: false },
    labelPalette: [{ name: {type:String,maxlength:60}, color: {type:String,default:'#a78bd0'}, _id:false }],
    customFields: [
      {
        name: String,
        type: { type: String, enum: ["text", "number", "date"] },
        visible: { type: Boolean, default: true },
        _id: false,
      },
    ],
    automations: [{
      id: { type: String, required: true, maxlength: 100 },
      name: { type: String, maxlength: 100 },
      trigger: { type: String, enum: ['on-move','on-complete','on-checklist','daily','weekly','due','card-button','board-button'], required: true },
      action: { type: String, enum: ['label','complete','priority','move','sort','remind'], required: true },
      sourceList: String,
      targetList: String,
      label: { type: String, maxlength: 60 },
      daysBefore: { type: Number, min: 0, max: 30, default: 1 },
      hour: { type: Number, min: 0, max: 23, default: 9 },
      weekday: { type: Number, min: 0, max: 6, default: 1 },
      enabled: { type: Boolean, default: true },
      lastRun: { type: String, default: '' },
      _id: false
    }],
    favorite: { type: Boolean, default: false },
    tone: { type: Number, min: 0, max: 3, default: 0 },
    revision: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
export default mongoose.model("Project", schema);
