class APIFeatures {

    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search() {

        const keyword = this.queryStr.keyword ? {

            name: {

                $regex: this.queryStr.keyword,
                $options: 'i'

            }

        } : {}

        const clonedObj = { ...keyword };

        this.query = this.query.find({ ...keyword });

        return this;

    }

    filter() {

        const queryCopy = { ...this.queryStr };

        const removeFields = ['keyword', 'limit', 'page']

        removeFields.forEach(el => delete queryCopy[el]);

        let queryStr = JSON.stringify(queryCopy);

        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`)

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }
}

module.exports = APIFeatures