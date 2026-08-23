const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'taskflowdb';

async function main(){
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  const coll = db.collection('tasks');

  // ensure index on _id exists by default; nothing else required

  app.get('/api/ping', (req,res)=> res.json({ok:true}));

  app.get('/api/tasks', async (req,res)=>{
    try{
      const rows = await coll.find({}).sort({_id:-1}).toArray();
      const tasks = rows.map(r=>({id:r._id,title:r.title,assignee:r.assignee,description:r.description,category:r.category,due:r.due,completed:!!r.completed}));
      res.json(tasks);
    }catch(err){ res.status(500).json({error:err.message}); }
  });

  app.post('/api/tasks', async (req,res)=>{
    try{
      const t = req.body || {};
      if(!t.id) return res.status(400).json({error:'Missing id'});
      await coll.updateOne({_id:t.id}, {$set:{title:t.title||'',assignee:t.assignee||'',description:t.description||'',category:t.category||'',due:t.due||'',completed:!!t.completed}}, {upsert:true});
      res.json({ok:true});
    }catch(err){ res.status(500).json({error:err.message}); }
  });

  app.put('/api/tasks/:id', async (req,res)=>{
    try{
      const id = req.params.id;
      const t = req.body || {};
      const result = await coll.updateOne({_id:id}, {$set:{title:t.title||'',assignee:t.assignee||'',description:t.description||'',category:t.category||'',due:t.due||'',completed:!!t.completed}});
      res.json({ok:true,changed: result.modifiedCount});
    }catch(err){ res.status(500).json({error:err.message}); }
  });

  app.delete('/api/tasks/:id', async (req,res)=>{
    try{
      const id = req.params.id;
      await coll.deleteOne({_id:id});
      res.json({ok:true});
    }catch(err){ res.status(500).json({error:err.message}); }
  });

  app.post('/api/sync', async (req,res)=>{
    try{
      const incoming = Array.isArray(req.body) ? req.body : [];
      const ops = incoming.map(t=>{
        const id = t.id || (Date.now().toString(36)+Math.random().toString(36).slice(2,6));
        return {
          updateOne: {
            filter: {_id: id},
            update: {$set: {title:t.title||'',assignee:t.assignee||'',description:t.description||'',category:t.category||'',due:t.due||'',completed:!!t.completed}},
            upsert: true
          }
        };
      });
      if(ops.length) await coll.bulkWrite(ops);
      const rows = await coll.find({}).sort({_id:-1}).toArray();
      const tasks = rows.map(r=>({id:r._id,title:r.title,assignee:r.assignee,description:r.description,category:r.category,due:r.due,completed:!!r.completed}));
      res.json(tasks);
    }catch(err){ res.status(500).json({error:err.message}); }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, ()=> console.log('Taskflow server (MongoDB) running on port', PORT));
}

main().catch(err=>{
  console.error('Failed to start server', err);
  process.exit(1);
});
