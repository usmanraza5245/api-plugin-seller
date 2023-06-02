import axios from "axios";

export const getUserByOpportunityId = async (userId) => {
  console.log("user on getUserByOpportunityId is ...", userId);
  console.log('user service url...', process.env.)
  let data = JSON.stringify({
    query: `query getUserByOpportunityId($userId: String!){
    getUserByOpportunityId(id:$userId){
      success
      message
      user{
        _id
        userName
        firstname
        lastname
        email
        opportunityId
        profilePic
        followers{
        follower{
          firstname
          lastname
          _id
        }
      }
      subscribers{
        subscriber{
          firstname
          lastname
          _id
        }
      }
      }
    }
  }`,
    variables: { userId: userId },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: process.env.USER_SERVICE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  return new Promise((resolve, reject) => {
    axios
      .request(config)
      .then((response) => {
        // console.log(JSON.stringify(response.data));
        resolve(response);
      })
      .catch((error) => {
        // console.log(error);
        reject(error);
      });
  });
};
