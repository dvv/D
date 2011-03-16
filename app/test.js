module.exports = {
	auth: function(req, res, next, a, b, c){
		res.send([a, b, c]);
	}
};
