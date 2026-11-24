import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  project: {type:String,required:true,index:true},
  card: {type:Number,required:true,index:true},
  actor: {type:String,default:'Teammate'},
  kind: {type:String,default:'change'},
  text: {type:String,maxlength:240,required:true},
},{timestamps:true});
schema.index({project:1,card:1,createdAt:-1});
export default mongoose.model('CardEvent',schema);
