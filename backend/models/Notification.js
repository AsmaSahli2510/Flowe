import mongoose from 'mongoose';
const schema=new mongoose.Schema({
 user:{type:String,required:true,index:true},
 workspace:String, project:String, card:Number,
 actor:String, kind:{type:String,enum:['mention','message','card','invitation','invitation_accepted','reminder','system'],default:'mention'},
 text:{type:String,maxlength:240},seen:{type:Boolean,default:false,index:true}
},{timestamps:true});
schema.index({user:1,createdAt:-1});
export default mongoose.model('Notification',schema);
