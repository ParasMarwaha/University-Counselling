const express = require('express');

const router = express.Router();
const connection = require("../connection");
const cookieParser = require("cookie-parser");
const {sign} = require('jsonwebtoken');
const nodemailer = require("nodemailer");

async function AdminLogin(req,res){
    //console.log(req.body)
    let {email, password}= req.body

    if(email === '' || password=== ''){
        res.json({error:'ALL FIELDS ARE REQUIRED', message:''})
    }else{
        // Authentication
        let checkUser= `SELECT * FROM admin WHERE email = '${email}' and password = '${password}'`
        //console.log(checkUser)
        connection.query(checkUser,(error,record)=>{
            if(error){
                res.json({error: error.message, message :''})
            }else{
                // console.log(record.length)
                if(record.length === 0){
                    res.json({error:"Invalid Email or Password", message: ''})
                }
                 else{
                  //  console.log(record[0].status)
                    if(record[0].status === "Inactive"){
                        res.json({error:'Access Denied'})
                    }
                    else{
                        //     // console.log(record)
                            let payload = {
                                id : record[0].id,
                                email: record[0].email,
                                name :record[0].name
                            }
                            let secret = "abc@123"
                            let expiry = 120 * 60

                            let token = sign(payload,secret,{expiresIn:expiry})
                            //console.log(token)

                            res.cookie('adminToken',token,
                                {expires : new Date (Date.now() + expiry  * 1000)})

                            res.json({error: '', message :'Login Success'})
                    }

                 }
            }
        })

    }
}

async function SendAdminOTP(req,res){
    console.log(req.body)
     let {email} = req.body;
     if(!email || !email.length) {
        res.json({error: 'Please enter email'});
     }
      else{
         let check = `select email from admin where email= '${email}'`;
         console.log(check)
         connection.query(check, (error, results) => {
             //console.log(results)
             //console.log(email)
             if (error){
                 res.json({error: error.message,message:''});
             }else if(results.length ===0) {
                 res.json({error: 'Email does not exist'});
             }
             else {
                // Generate a random OTP (e.g., 6-digit number)
                const otp = Math.floor(100000 + Math.random() * 900000);
                //console.log(otp)
                let generateotp = `update admin set otp = ${otp} where email= '${email}'`;
                // console.log(generateotp)
                connection.query (generateotp, (error, results) => {
                    if (error) {
                        res.json({error: error.message,message:''});
                    }else{
                        // Send OTP to the email address using a mailer service (e.g., Nodemailer)
                        const transporter = nodemailer.createTransport({
                            host: 'smtp.gmail.com',
                            port: 587,
                            secure: false, // or 'STARTTLS'
                            auth: {
                                user: 'parasmarwaha246@gmail.com',
                                pass: 'auxq kiup dcan wlzi'
                            }
                        });

                        const mailOptions = {
                            from: 'parasmarwaha246@gmail.com',
                            to: email,
                            subject: 'Admin OTP Verification',
                            text: `Your OTP is: ${otp}`
                        };
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                res.json({ error: 'Failed to send OTP',message:'' });
                            }

                            // console.log('OTP sent to', email);
                            res.json({error:'', message: 'OTP sent successfully' });
                        });
                    }
                })


             }
         })
     }
}

async function VerifyAdminOTP(req,res){
   // console.log(req.params)
    //console.log(req.body)
    // console.log("here")
    let {email} = req.params ;
    let {adminotp} = req.body ;
    if(!adminotp){
        res.json({error:'Please enter otp',message:''});
    }else {
        let check = `select email from admin where email= '${email}'`;
        //console.log(check)
        connection.query(check, (error, results) => {
            //console.log(results[0].email)
            //console.log(email)
            if (error){
                res.json({error: error.message,message:''});
            }else if(results.length ===0) {
                res.json({error: 'Email does not exist'});
            }else {
                let getotp = `select otp from admin where email= '${email}' `;
                //console.log(getotp);
                connection.query(getotp, (error, results) => {
                    //  console.log(results[0].otp)
                    if (error) {
                        res.json({error: error.message,message:''});
                    }else if(results[0].otp !== adminotp) {
                        res.json({error:'Enter correct OTP',message:''});
                    }else{
                        let nullotp = `update admin set otp = NULL where email= '${email}'`;
                        // console.log(nullotp)
                        connection.query(nullotp, (error, results) => {
                            if (error) {
                                res.json({error: error.message,message:''});
                            } else{
                                res.json({error:'', message:'Verified '});
                            }
                        })
                    }
                })

            }
        })


   }
}

async function ChangeAdminOTPPassword(req,res) {
    //console.log(req.body)
    let {email} = req.params;
    //console.log(req['customerInfo'])
    let {newpass, confirm} = req.body;

    if (!newpass || !confirm) {
        res.json({error: 'All fields are required'});
    } else if (newpass !== confirm) {
        res.json({error: 'New password and confirm password do not match'});
    } else {
        let check = `select email from admin where email= '${email}'`;
        //console.log(check)
        connection.query(check, (error, results) => {
            //console.log(results[0].email)
            //console.log(email)
            if (error) {
                res.json({error: error.message, message: ''});
            } else if (results.length === 0) {
                res.json({error: 'Email does not exist'});
            } else {
                const query = `UPDATE admin set password = '${newpass}' WHERE email = '${email}'`;
                // console.log(query)
                connection.query(query, (error, results) => {
                    if (error) {
                        res.json({error: error.message, message: ''});
                    } else {
                        res.json({error: '', message: 'Password Changed Successfully'})
                    }
                })
            }
        })
    }
}

async function AddAdmin(req,res) {
   // console.log(req.body)
    let {name, email, type} = req.body;
    const password = Math.floor(100000 + Math.random() * 900000);

   // console.log(password)

    const checkEmailQuery = `SELECT * FROM admin WHERE email = '${email}'`
    connection.query(checkEmailQuery, (error, results) => {
        if (error) {
            res.json({error: error.message})
        } else if (results.length > 0) {
            res.json({error: 'Email already registered'})
        } else {

            let add = `Insert into admin (name, password , email , type) values ('${name}','${password}','${email}','${type}')`;
            connection.query(add, (error) => {
                if (error) {
                    res.json({error: error.message, message: ''});
                } else {
                    // Send password to the email address using a mailer service (e.g., Nodemailer)
                    const transporter = nodemailer.createTransport({
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false, // or 'STARTTLS'
                        auth: {
                            user: 'parasmarwaha246@gmail.com',
                            pass: 'auxq kiup dcan wlzi'
                        }
                    });

                    const mailOptions = {
                        from: 'parasmarwaha246@gmail.com',
                        to: email,
                        subject: 'User Password',
                        text: `Your password is: ${password}`
                    };
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            res.json({error: 'Failed to send password', message: ''});
                        }

                        // console.log('OTP sent to', email);
                        res.json({error: '', message: 'User Added '});
                    });
                }
            })
        }
    })
}

async function ReadUser(req,res){
    let read = `Select * from admin ` ;
    connection.query(read,(error, records) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', records: records});
        }
    })
}

async function AddCourse(req,res) {
     console.log(req.body)
    let {name,pcm, courseFee,number,type} = req.body;
    //console.log(password)

   const check = `SELECT * FROM courses WHERE course_name = '${name}'`
    connection.query(check, (error, results) => {
        if (error) {
            res.json({error: error.message})
        } else if (results.length > 0) {
            res.json({error: 'Course Already Exist'})
        } else {

            let add = `Insert into courses (course_name,pcm,course_fee,counselling_fee,degree) values ('${name}','${pcm}','${courseFee}','${number}','${type}')`;
            connection.query(add, (error) => {
                if (error) {
                    res.json({error: error.message, message: ''});
                } else {
                   res.json({error:'',message:'Course Added successfully.'})
                }
            })
        }
    })
}

async function ReadCourse(req,res){
    let read = `Select * from courses ` ;
    connection.query(read,(error, records) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', records: records});
        }
    })
}

async function UpdateCourse(req,res){
    console.log(req.body)
    let{id,name,courseFee,fee,degree} = req.body;
    let update = `UPDATE courses SET course_name = '${name}',course_fee=${courseFee},counselling_fee= ${fee},degree= '${degree}' WHERE id = ${id}`;
    connection.query(update, (error) => {

        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', message:'Update course successfully.'});
        }
    })
}

async function DeleteCourse(req,res){
    console.log(req.params)
    let {id} = req.params
    const deleteuser = `delete from courses where id= ${id} `
    // console.log(deleteuser)
    connection.query(deleteuser, (error)=>{
        if(error){
            res.json({error: error.message, message:''})
        }else{
            res.json({error: '' , message: 'User Record Deleted.'})
        }
    })
}

async function Inactive(req,res){
    console.log(req.params)
    let {id} = req.params
    let update = `update admin set status = 'Inactive' where id = ${id}` ;
    connection.query(update, (error) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', message:'Status Updated successfully.'})
        }
    })
}

async function Active(req,res){
    console.log(req.params)
    let {id} = req.params
    let update = `update admin set status = 'Active' where id = ${id}` ;
    connection.query(update, (error) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', message:'Status Updated successfully.'})
        }
    })
}

async function AddSeats(req,res){
    // console.log(req.body)
    let {course_id,quota,seats} = req.body;
    // console.log(password)

    const check = `SELECT * FROM seats WHERE course_id = ${course_id} AND quota = '${quota}'`
    connection.query(check, (error, results) => {
        if (error) {
            res.json({error: error.message})
        } else if (results.length > 0) {
            res.json({error: 'Quota Seats Already Exist'})
        } else {

            let add = `Insert into seats (course_id,quota,Seat_count) values ('${course_id}','${quota}','${seats}')`;
            connection.query(add, (error) => {
                if (error) {
                    res.json({error: error.message, message: ''});
                } else {
                    res.json({error:'',message:'Quota Seats Added successfully.'})
                }
            })
        }
    })
}

async function ReadSeat(req,res){
    let{id} = req.params
    let read = `Select * from seats where course_id = '${id}' ` ;
    console.log(read)
    connection.query(read,(error, records) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', records: records});
        }
    })
}

async function UpdateSeat(req,res){
    console.log(req.body)
    let{id,seat,quota} = req.body;
    let update = `UPDATE seats SET quota = '${quota}',Seat_count= ${seat} WHERE id = ${id}`;
    console.log(update)
    connection.query(update, (error) => {

        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', message:'Updated successfully.'});
        }
    })
}

async function GetCourses(req,res){
   // console.log(req.body)
    let{degName} = req.body;
    let get = `SELECT * FROM courses WHERE degree = '${degName}'`;
    connection.query(get, (error,records) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error:'',records:records})
        }
    })
}

function ReadStudent(req, res) {
    let read = `Select * from admission where status = 'PENDING' ` ;
    connection.query(read,(error, records) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', records: records});
        }
    })
}

function ReadStudentConfirm(req, res) {
    let read = `Select * from admission where status = 'CONFIRMED' ` ;
    connection.query(read,(error, records) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', records: records});
        }
    })
}


function UpdatePersonalInfo(req,res){
    //console.log(req.body)
    let{id,full_name,father_name,email,mother_name,dob,phone,aadhaar,gender,guardian_email,guardian_mobile}=req.body;
    let update = `update admission set full_name='${full_name}',father_name='${father_name}',mother_name ='${mother_name}',email='${email}',dob='${dob}',phone='${phone}',
 aadhaar='${aadhaar}',gender='${gender}',gardian_no ='${guardian_mobile}',gardian_email ='${guardian_email}' where id = ${id}`;
    connection.query(update, (error) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', message:'Personal Information Updated successfully.'});
        }
    })
}

function UpdateAddress(req,res){
    //console.log(req.body)
   // console.log(req.params)
    let{id} = req.params
    let {punjab_outside,address_permanent,district,state,hosteller,caste} = req.body;
    let update = `update admission set residence ='${punjab_outside}', caste = '${caste}',address ='${address_permanent}',district='${district}', state ='${state}',hostel='${hosteller}' where id = ${id}`;
    connection.query(update, (error) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', message:'Address Updated successfully.'});
        }
    })
}

function UpdateDegree(req,res){
   // console.log(req.body)
    let {id,degree_type,course} = req.body;
    let update = `update admission set degName ='${degree_type}', course_id = '${course}' where id = ${id}`;
    connection.query(update, (error) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', message:'Degree Updated successfully.'});
        }
    })
}

function UpdatePhoto(req,res){
   // console.log(req.files)
    let{photo} = req.files


    let{id} = req.body
    let photoServerPath = `public/form-img/photo/${photo.name}`
    let photoDBPath = `/form-img/photo/${photo.name}`

    photo.mv(photoServerPath,(error)=> {
        if (error) {
            res.json({error: error.message})
        }
        else {
            let update = `update admission set photo ='${photoDBPath}' where id = ${id}`;
            connection.query(update, (error) => {
                if (error) {
                    res.json({error: error.message})
                }else{
                    res.json({error: '', message:'Student Photo Updated successfully.'});
                }
            })
        }
    })
}

function UpdateSignature(req,res){
   // console.log(req.files)
    let{signature} = req.files

    let {id}=req.body;
    let signatureServerPath = `public/form-img/signature/${signature.name}`
    let signatureDBPath = `/form-img/signature/${signature.name}`

    signature.mv(signatureServerPath,(error)=>{
        if(error){
            res.json({error: error.message})
        }
        else{
            let update = `update admission set signature ='${signatureDBPath}' where id = ${id}`;
            connection.query(update, (error) => {
                if (error) {
                    res.json({error: error.message})
                }else{
                    res.json({error: '', message:'Signature Updated successfully.'});
                }
            })
        }
    })

}

function ReadCourseName(req, res) {
   // console.log(req.params)
    let{id} = req.params
    let read = `Select * from courses where id = '${id}' ` ;
    connection.query(read,(error, records) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', records: records});
        }
    })
}

function SeatSearch(req,res){
    //console.log(req.body)
    let{degName,course,prefOrder,punjab_outside,caste} = req.body;
    let search = `select * from admission as a  inner join preference as p on a.id = p.student_id where a.degName = '${degName}' and p.courses_id ='${course}' and p.order_no = '${prefOrder}' and residence ='${punjab_outside}' and caste='${caste}' and seatStatus='PENDING'`;
    //console.log(search)
    connection.query(search, (error, results) => {
        if (error) {
            res.json({error: error.message})
        }
        else{
            res.json({error: '', records: results});
        }
    })
}

function AllotSeat(req, res) {
    let { id } = req.adminInfo;
    let { course, punjab_outside, caste } = req.body;
    let { student_id } = req.params;

    // Validate inputs (e.g., ensure course, caste, etc., are properly formatted)

    // Check if there are available seats
    let checkSeatsQuery = `SELECT Seat_count FROM seats WHERE quota = '${caste}' AND course_id = ${course}`;
    connection.query(checkSeatsQuery, [caste, course], function (error, results) {
        if (error) {
            res.json({ error: error.message });
        } else {
            if (results.length > 0 && results[0].Seat_count > 0) {
                // Start a transaction for atomicity
                connection.beginTransaction(function (err) {
                    if (err) {
                        return res.json({ error: err.message });
                    }

                    let insertQuery = `INSERT INTO studentseat (student_id, course_id, staff_id, residense, caste, date) VALUES ('${student_id}','${course}',${id},'${punjab_outside}','${caste}', CURDATE())`;
                    connection.query(insertQuery, [student_id, course, id, punjab_outside, caste], function (error, results) {
                        if (error) {
                            connection.rollback(function () {
                                res.json({ error: error.message });
                            });
                        } else {
                            let updateQuery = `UPDATE admission SET seatStatus = 'Alloted', status = 'CONFIRMED' WHERE id = ${student_id}`;
                            connection.query(updateQuery, [student_id], function (error, results) {
                                if (error) {
                                    connection.rollback(function () {
                                        res.json({ error: error.message });
                                    });
                                } else {
                                    let updateSeatsQuery = `UPDATE seats SET Seat_count = Seat_count - 1 WHERE quota = '${caste}' AND course_id = ${course}`;
                                    connection.query(updateSeatsQuery, [caste, course], function (error, results) {
                                        if (error) {
                                            connection.rollback(function () {
                                                res.json({ error: error.message });
                                            });
                                        } else {
                                            connection.commit(function (err) {
                                                if (err) {
                                                    connection.rollback(function () {
                                                        res.json({ error: err.message });
                                                    });
                                                } else {
                                                    res.json({ error: '', message: 'Seat Alloted' });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            } else {
                res.json({ error: 'No more seats available for this quota' });
            }
        }
    });
}

function Alloted(req, res) {
    // console.log(req.params)
    let read = `Select * from studentseat` ;
    connection.query(read,(error, records) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', records: records});
        }
    })
}

function Allotted(req, res) {
    // console.log(req.body)
    let{course,prefOrder,punjab_outside,caste} = req.body;
    let read = `SELECT a.full_name,c.course_name,ss.name,s.* FROM admission as a JOIN studentseat as s ON a.id = s.student_id JOIN admin as ss ON ss.id = s.staff_id JOIN courses as c ON s.course_id = c.id where s.course_id =${course} and s.residense = '${punjab_outside}'` ;
    //console.log(read)
    connection.query(read,(error, records) => {
        if (error) {
            res.json({error: error.message})
        }else{
            res.json({error: '', records: records});
        }
    })
}

function SendEmail(req, res) {
    // console.log(req.body)
    let{student_id} = req.params ;
    let read = `SELECT a.*,c.course_name,c.course_fee,ss.name,s.* FROM admission as a JOIN studentseat as s ON a.id = s.student_id JOIN admin as ss ON ss.id = s.staff_id JOIN courses as c ON s.course_id = c.id where s.student_id =${student_id}` ;
    //console.log(read)
    connection.query(read,(error, records) => {
        if (error) {
            res.json({error: error.message})
        }
        else
        {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // or 'STARTTLS'
                auth: {
                    user: 'parasmarwaha246@gmail.com',
                    pass: 'auxq kiup dcan wlzi'
                }
            });


            const mailOptions = {
                from: 'parasmarwaha246@gmail.com', // Use environment variables
                to: records[0].email,
                subject: 'Confirmation Mail for Admission',
                html: `<p>Dear ${records[0].full_name},</p>
                   <p>${records[0].address}</p>
                   <p>Your Student ID: ${student_id}</p>
                   <p>Thanks for your interest at Sardar Beant Singh State University, Gurdaspur. We are happy to inform you that your admission in B.Tech Information Technology is provisionally confirmed, subject to verification of original certificates and payment of pending fee if any. You can get the certificates checked at the university within the next 10 working days.</p>
                   <p><strong>Your Course : ${records[0].course_name}</strong></p>
                   <p><strong>Fees of Course : ${records[0].course_fee}</strong></p>
                   <p>In case of any pending fee, you are required to pay the balance fee within the next 10 working days. You can pay fees at the university. If you cannot visit the university, you can also deposit the fee by NEFT/UPI in the following account and send the fee receipt and copies of certificates to paras@gmail.com.</p>
                   <p>In case all the certificates have not been submitted by you, you are required to do so at the earliest.</p>
                   <p><strong>Certificates required for admission:</strong></p>
                   <ul>
                       <li>Seat Allotment Letter.</li>
                       <li>Residence Certificate.</li>
                       <li>Matriculation Certificate containing the date of birth and other basic credentials.</li>
                       <li>Detailed Marks Card(s) of the qualifying examination.</li>
                       <li>Character Certificate from the Principal of the Institution last attended.</li>
                       <li>Migration Certificate related to the qualifying examination.</li>
                       <li>Reserve Category / Sub-category Certificate from the Competent Authority, if applicable.</li>
                       <li>Income certificate (For Punjab resident low income SC/ST category - income less than Rs. 250,000).</li>
                       <li>Aadhaar Card.</li>
                       <li>Gap certificate, if applicable.</li>
                       <li>Counselling Fee Deposit Slip.</li>
                       <li>Six recent passport size photographs.</li>
                       <li>Any other certificate (if applicable).</li>
                   </ul>
                   <p><em>Note: If due to any reason, you are not able to provide any certificate, the admission will be done provisionally, subject to production of the certificate later on.</em></p>`
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    res.json({error: 'Failed to send confirmation mail', message: ''});
                }
                else{
                    let update = `update studentseat set emailStatus = 'SENT' where student_id = ${student_id}`;
                    connection.query(update, (error, info) => {
                        if (error) {
                            res.json({error: 'Failed to send confirmation mail', message: ''});
                        }
                        else{
                            res.json({error: '', message: 'Offer Letter Send Successfully',records:records});
                        }
                    })
                }
            });
        }
    })
}

function GetPaymentInfo(req, res) {
    let{student_id} = req.params ;
    let read = `SELECT a.*,c.course_name,c.course_fee,ss.name,s.* FROM admission as a JOIN studentseat as s ON a.id = s.student_id JOIN admin as ss ON ss.id = s.staff_id JOIN courses as c ON s.course_id = c.id where s.student_id =${student_id}` ;
    //console.log(read)
    connection.query(read,(error, records) => {
        if (error) {
            res.json({error: error.message})
        } else {
            let read2 = `SELECT student_id, SUM(amount) AS total_paid FROM fees_history WHERE student_id = ${student_id} GROUP BY student_id`;
            connection.query(read2, (error, results) => {
                if (error) {
                    res.json({error: error.message})
                } else {
                    res.json({error:'',records:records,results:results})
                }
            })
        }
    })
}

function GetPay(req, res) {
   // console.log(req.params)
    let{student_id} = req.params ;
    let read = `SELECT a.*,s.* FROM admission as a JOIN fees_history as s ON a.id = s.student_id  where a.id =${student_id}` ;
    //console.log(read)
    connection.query(read,(error, records) => {
        if (error) {
            res.json({error: error.message})
        }
        else{
            res.json({error:'',records:records})
        }
    })

}

function PayFee(req,res){
    //console.log(req.body)
    let {mode,amount,remarks,student_id} = req.body ;
    let insert = `insert into fees_history (student_id,amount,mode,remarks,PayDate) values (${student_id},${amount},'${mode}','${remarks}',curdate())`;
    connection.query(insert,(error, records) => {
        if (error){
            res.json({error: error.message})
        }
        else{
            res.json({error:'',message:'Payment Success.'})
        }
    })
}

function PayFeeOnline(req,res){
    //console.log(req.body)
    let {mode,amount,remarks,student_id,payment_id} = req.body ;
    let insert = `insert into fees_history (student_id,amount,mode,remarks,PayDate,T_id) values (${student_id},${amount},'${mode}','${remarks}',curdate(),'${payment_id}')`;
    connection.query(insert,(error, records) => {
        if (error){
            res.json({error: error.message})
        }
        else{
            res.json({error:'',message:'Payment Success.'})
        }
    })
}





module.exports = {

    AdminLogin,
    VerifyAdminOTP,
    SendAdminOTP,
    ChangeAdminOTPPassword,
    AddAdmin,
    ReadUser,
    AddCourse,
    ReadCourse,
    UpdateCourse,
    DeleteCourse,
    Inactive,
    Active,
    AddSeats,
    ReadSeat,
    UpdateSeat,
    GetCourses,
    ReadStudent,
    UpdatePersonalInfo,
    UpdateAddress,
    UpdateDegree,
    UpdatePhoto,
    UpdateSignature,
    ReadCourseName,
    SeatSearch,
    AllotSeat,
    Alloted,
    Allotted,
    SendEmail,
    ReadStudentConfirm,
    GetPaymentInfo,
    GetPay,
    PayFee,
    PayFeeOnline
};