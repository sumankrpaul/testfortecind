const express= require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
let bookObj, userObj, borrowObj;

const app = express();
function createBooks(){
    const bookSchema = new mongoose.Schema({
        bookId: String,
        bookName: String
    })
    
    bookObj = mongoose.model('Books', bookSchema);
}

function createUsers(){
    const userSchema = new mongoose.Schema({
        username: String
    })
    
    userObj = mongoose.model('Users', userSchema);
}

function createBorrow(){
    const borrowSchema = new  mongoose.Schema({
        bookId: {
            type: mongoose.Types.ObjectId,
            ref: 'Books'
        },
        userId: {
            type: mongoose.Types.ObjectId,
            ref: 'Users'
        },
        borrowDate: Date,
        returnDate: Date
    })
    
    borrowObj = mongoose.model('Borrow', borrowSchema);
}
app.use(bodyParser.json());

app.get('/', (req,res)=>{
    res.send('Hi');
});

app.get('/books', async (req,res)=>{
    try{
        const list = await borrowObj.aggregate([
            { $lookup: {
                from: 'books',
                localField: 'bookId',
                foreignField: '_id',
                as: 'book'
            } },
            { $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            } },
            { $unwind: '$user' },
            { $unwind: '$book' },
            {
                $project: {
                    book: 1,
                    user: 1,
                    borrowDate: 1,
                    returnDate: 1,
                    duration: {
                        $dateDiff:{
                            startDate: '$borrowDate',
                            endDate: '$returnDate',
                            unit: "hour"
                        }   
                    }
                }
            },
            {
                $sort: {duration: -1}
            }
        ]);
        res.send(list);

    } catch (err){
        console.log(err);
        res.status(500).send(err.message);
    }
});

app.get('/longest', async (req,res)=>{
    try{
        const longestBorrow = await borrowObj.aggregate([
            {$project: {
                    bookId: 1,
                    userId: 1,
                    borrowDate: 1,
                    returnDate: 1,
                    duration: {
                        $dateDiff:{
                            startDate: '$borrowDate',
                            endDate: '$returnDate',
                            unit: "hour"
                        }   
                    }
                }
            },
            
            {$sort: {duration: -1}},
            {$limit: 1},
            { $lookup: {
                from: 'books',
                localField: 'bookId',
                foreignField: '_id',
                as: 'book'
            } },
            { $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            } },
            { $unwind: '$user' },
            { $unwind: '$book' },
            {$project: {book:1,user:1,borrowDate:1,returnDate:1 } }
        ]);

        res.send(longestBorrow);
    } catch (err){
        console.log(err);
        res.status(500).send(err.message);
    }
})

async function mongooseConnect(){
    try{
        await mongoose.connect('mongodb://127.0.0.1:27017/test');
        createBooks();
        createUsers();
        createBorrow();
        console.log("DB connected");
    } catch(e){
        console.log(e);
    }
} 

app.listen(8080, ()=>{
    mongooseConnect();
    console.log("App is runing on 8080");
});