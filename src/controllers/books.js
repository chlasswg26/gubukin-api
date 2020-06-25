const booksModels = require('../models/books');
const helper = require('../helpers');
const redisClient = require('../config/redis');

module.exports = {
    getBooks: async function (req, res) {
        try {
          if (req.query.page === undefined || req.query.page === "") {
            req.query.page = 1;
          }
    
          if (req.query.limit === undefined || req.query.limit === "") {
            req.query.limit = 6;
          }
          if (req.query.sort === "false") {
            req.query.sort = "DESC";
          } else {
            req.query.sort = "ASC";
          }
          if (req.query.value === undefined || req.query.value === "") {
            req.query.value = "books.title";
          } else if (req.query.value === "title") {
            req.query.value = "books.title";
          } else if (req.query.value === "author") {
            req.query.value = "author.name";
          }
          if (req.query.search === undefined || req.query.search === "") {
            req.query.search = "";
          }
          const value = req.query.value;
          const sort = req.query.sort;
          const limit = parseInt(req.query.limit);
          const start = (req.query.page - 1) * limit;
          const currentPage = parseInt(req.query.page);
          const next = parseInt(currentPage + 1);
          const previous = parseInt(currentPage - 1);
          const search = `%${req.query.search}%`;
          const data = await booksModels.getCountBooks(search);
          const result = await booksModels.getBooks(
            search,
            value,
            sort,
            start,
            limit
          );
          const totalData = data[0]["COUNT(*)"];
          const totalPage = Math.ceil(totalData / limit);
          const pagination = {
            totalPage,
            totalData,
            currentPage,
            limit,
            next,
            previous,
          };

          console.log(helper.convertObjectToPlainText(req.query));
          redisClient.get(`getBooks:${helper.convertObjectToPlainText(req.query)}`, function (error, data) {
            if (error) throw error;

            if (data != null) {
              const cache = JSON.parse(data);
              return helper.response(res, 200, cache, pagination);
            } else {
              const cached = JSON.stringify(result, null, 0);
              redisClient.setex(`getBooks:${helper.convertObjectToPlainText(req.query)}`, 3600, cached, function (error, reply) {
                if (error) throw error;

                console.log(reply);
              })
            }
          })
        } catch (error) {
            console.log(error)
          return helper.response(res, 500, error);
        }
      },
    postBook: async function (request,response){
        try {
            const setData =request.body
            setData.image = request.files['image'][0].filename
            setData.file_ebook=request.files['file_ebook'][0].filename
            const result = await booksModels.postBook(setData);
            return helper.response(response, 200, {result})
        } catch (error) {
            console.log(error)
            return helper.response(response, 500, { message: error.name })

        }
    },
    putBook: async function(request,response){
        try {
            const setData= request.body
            const id = request.params.id
            const book = await booksModels.getBookById(id)
            if (request.files['image']) {
              
                    setData.image = request.files['image'][0].filename
            await booksModels.deletefileBook(book[0].image,'')

            }
            if (request.files['file_ebook']) {
               
                    setData.file_ebook=request.files['file_ebook'][0].filename
                    await booksModels.deletefileBook('',book[0].file_ebook)

               
            }
          
            // await booksModels.deletefileBook(book[0].image,book[0].file_ebook)
   
            // setData.image = request.files['image'][0].filename
            // setData.file_ebook=request.files['file_ebook'][0].filename
         
            const result = await booksModels.putBook(setData,id)
            return helper.response (response,200,result)
        } catch (error) {
            console.log(error)
            return helper.response (response,500,error)
            
        }
    },
    deleteBook: async function(request,response){
        try {
            const id =request.params.id;
            const book = await booksModels.getBookById(id)
            await booksModels.deletefileBook(book[0].image,book[0].file_ebook)

            const result = await booksModels.deleteBook(id)

            return helper.response(response, 200, result)
        } catch (error) {
            console.log(error)
            return helper.response(response, 500, error)

        }
    }
}