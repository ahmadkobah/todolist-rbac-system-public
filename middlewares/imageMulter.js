const multer = require('multer');
// Memory Storage________________________________

    // Single Image

exports.uploadSingleImage = (fieldName) => {
    const storage = multer.memoryStorage();
    return multer({ storage: storage }).single(fieldName);
}



// const storage = multer.memoryStorage();

// const memoryStorage = function(req, file, cb) {
    
//         if(file.mimtype.strartsWith("Image"))
//         {
//             cb(null, true);
//         }else{
//             cb(new Error("Only images are allowed"))
//         }

//         const upload = multer({ storage: storage , filter : memoryStorage })
//         return upload;

//     }




// Disk Storage________________________________________

    // Singel Image

// exports.uploadSingleImage = (fieldName) => {
//     console.log(file.mimetypr);
//     const storage = multer.diskStorage({
        
//     destination: function (req, file, cb) {
//         cb(null, './uploads/product');
//         },
//         filename: function (req, file, cb) {
//             const uniqueSuffix = `user ${uuid4()}.jpeg`
//             cb(null, uniqueSuffix)
//         }
//     })
// }

    // Multi Images

// exports.uploadMulImage = (arrayOffields) =>{

//     const storage = multer.diskStorage({
//         destination: function (req, file, cb) {
//             cb(null, './uploads/product');
//         },
//         filename: function (req, file, cb) {
//             const uniqueSuffix = `user ${uuid4()}.jpeg`
//             cb(null, uniqueSuffix)
//         }
//     });

//     return multer({ storage: storage }).fields(arrayOffields);


// }

// const multer = require('multer');

// const multerOption = () => {
//   const storage = multer.memoryStorage();
  






