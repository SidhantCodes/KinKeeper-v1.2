require('dotenv').config();
const express = require("express");
const path = require('path');
const cors = require('cors');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage').GridFsStorage
const Grid = require('gridfs-stream')
const {GridFSBucket} = require("mongodb");

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 600 * 1000,sameSite:'strict'},
    rolling: true
}))

function checkSession(req, res, next) {
    if (req.session.user) next()
    else res.send("Unauthorized,log in.")
}

mongoose.connect('mongodb://localhost:27017/kinkeeper').then(() => {
    console.log("Connected to the database.")
});
const connection = mongoose.connection;
let gfs;
connection.once('open', () => {
    gfs = Grid(connection.db, mongoose.mongo);
    gfs.collection('uploads');
});

const userSchema = new mongoose.Schema({
    fName: String,
    lName: String,
    email: String,
    phone: String,
    gender: String,
    dob: Date,
    userid: String,
    password: String,
});
const taskSchema = new mongoose.Schema({
    task: String,
    deadline: Date,
    description: String,
    priority: Number,
    uid: String
})
const expenseSchema = new mongoose.Schema({
    expense: String,
    amount: Number,
    uid: String
})
const scheduleSchema = new mongoose.Schema({
    date: Number,
    name: String,
    time: String,
    location: String,
    description: String,
    month: String,
    day: String,
    uid: String
})

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);
const Expense = mongoose.model('Expense', expenseSchema)
const Schedule = mongoose.model('Schedule', scheduleSchema)

app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, '../pages/landing.html'));
} )

app.post("/register", async (req, res) => {
    let ifExists = await User.findOne({userid: req.body.userid})
    if (ifExists)
        res.send("Account associated with this email already exists.");
    else {
        let newUser = new User({
            fName: req.body.fName,
            lName: req.body.lName,
            email: req.body.email,
            phone: req.body.phone,
            gender: req.body.gender,
            dob: req.body.dob,
            userid: req.body.userid,
            password: req.body.password
        })
        await newUser.save();
        req.session.user = newUser;
        res.send("Credentials validated and added.")
    }
});

app.post("/login", async (req, res) => {
    let ifExists = await User.findOne({userid: req.body.userid, password: req.body.password})
    if (ifExists) {
        req.session.user = ifExists;
        // res.send("Login Successful --> " + req.session.user._id)
        res.redirect('http://localhost:5500/pages/dashboard.html');
    } else
        res.send("Email or password not correct.")
});

app.get('/getUser', checkSession, async(req, res) => {
    // res.json(req.session.user);

    res.json({fName:req.session.user.fName});
    // console.log(req.session.user.fName);
});




app.get("/login", (req, res) => {
    res.send("Please log in.")
})

app.get('/logout', async (req, res) => {
    await req.session.destroy(err => {
        if (err) {
            res.send("Logged out successfully.")
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

app.get("/tasks", checkSession, async (req, res) => {
    let tasks = await Task.find({uid: req.session.user._id});
    if (tasks.length === 0)
        res.send("You don't have any pending tasks at the moment.")
    else {
        res.send(tasks)
    }
})

app.post("/tasks", checkSession, async (req, res) => {
    let newTask = new Task({
        task: req.body.task,
        deadline: req.body.deadline,
        description: req.body.description,
        priority: req.body.priority,
        uid: req.session.user._id
    })
    await newTask.save();
    res.send("Task saved successfully.")
})

app.get("/expense", checkSession, async (req, res) => {
    let expenses = await Expense.find({uid: req.session.user._id})
    if (expenses.length === 0) res.send("You have no expenses")
    else res.json(expenses)
})

app.post("/expense", checkSession, async (req, res) => {
    let newExpense = new Expense({
        expense: req.body.expense,
        amount: req.body.amount,
        uid: req.session.user._id
    })
    await newExpense.save()
    res.send("Expense saved successfully.")
})

app.delete("/expense/:id", checkSession, async (req, res) => {
    let expenseId = req.params.id;
    let expense = await Expense.findById(expenseId);
    if (!expense) res.status(404).send("No expense found with this id.")
    else {
        await Expense.findByIdAndDelete(expenseId);
        res.send("Expense deleted successfully.")
    }
})

app.get("/schedule", checkSession, async (req, res) => {
    let schedules = await Schedule.find({uid: req.session.user._id});
    if (schedules.length === 0) res.send("You have an empty schedule.")
    else res.send(schedules)
})

app.post("/schedule", checkSession, async (req, res) => {
    let input = new Date(req.body.date)
    let date = input.getDate();
    let dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let day = dayNames[input.getDay()];
    let month = input.getMonth() + 1;
    let newSchedule = new Schedule({
        name: req.body.name,
        time: req.body.time,
        location: req.body.location,
        description: req.body.description,
        date: date,
        day: day,
        month: month,
        uid: req.session.user._id
    })
    await newSchedule.save()
    res.send("Schedule added successfully.")
})

function dynamicCategory(input) {
    return new GridFsStorage({
        url: process.env.URI,
        file: (req, file) => {
            return new Promise((resolve, reject) => {
                const filename = file.originalname;
                const fileInfo = {
                    filename: filename,
                    metadata: {
                        category: input,
                        uid: req.session.user._id
                    },
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        }
    });
}

function createAmenity(input) {
    app.get(`/${input}`, checkSession, async (req, res) => {
        let result = await mongoose.connection.db.collection('uploads.files')
            .find({"metadata.category": `${input}`, "metadata.uid": req.session.user._id }).toArray();
        if (result.length === 0)
            res.send(`You have no files in ${input} folder.`)
        else res.send(result);
    })
    const storage = dynamicCategory(input)
    const upload = multer({storage})
    app.post(`/${input}/upload`, checkSession, upload.single('file'), (req, res) => {
        if (!req.file)
            res.send("File not uploaded.")
        res.send(`File uploaded Successfully in the ${input} folder.`)
    })
}

let amenities = ['electronics', 'home', 'payments', 'maintenance', 'supplies', 'health', 'travel', 'legal'];
for (let amenity of amenities)  createAmenity(amenity)

app.get('/download/:filename', async (req, res) => {
    try {
        const bucket = new GridFSBucket(mongoose.connection.db, {bucketName: 'uploads'});
        const file = await mongoose.connection.db.collection('uploads.files').findOne({filename: req.params.filename});
        if (!file) {
            res.status(404).json({message: 'File not found'});
            return;
        }
        const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(file._id));
        downloadStream.pipe(res);
        downloadStream.on('error', (error) => {
            console.error('Error downloading file:', error);
            res.status(500).send('Internal server error');
        });
        downloadStream.on('finish', () => {
            console.log('File downloaded successfully');
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
    }
});

app.listen(3000, () => {
    console.log("SERVER ON")
})
