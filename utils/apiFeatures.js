class APIFeatures {

    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
        // console.log(this.query, this.queryStr)
    }

    search() {

        const keyword = this.queryStr.keyword ? {

            name: {

                $regex: this.queryStr.keyword,

                $options: 'i'

            }

        } : {}

        //console.log(this.queryStr);
        const clonedObj = { ...keyword };

        this.query = this.query.find({ ...keyword });

        return this;

    }

    filter() {

        const queryCopy = { ...this.queryStr };

        // console.log(queryCopy);

        // Removing fields from the query

        const removeFields = ['keyword', 'limit', 'page']

        removeFields.forEach(el => delete queryCopy[el]);
        // console.log(queryCopy);

        // Advance filter for price, ratings etc

        let queryStr = JSON.stringify(queryCopy);

        // console.log(queryStr);

        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`)

        // console.log(queryStr);

        this.query = this.query.find(JSON.parse(queryStr));

        // console.log(JSON.parse(queryStr));

        return this;
    }
}

module.exports = APIFeatures