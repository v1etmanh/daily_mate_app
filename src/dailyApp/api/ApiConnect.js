import { apiclient } from "./BaseApi"
export const getDishByDate=(date)=>{
  return apiclient.get("/getDish", {params:{
    createDate:date
  }})
}
export const getIngredient = (defineIngredient) => {
  return apiclient.post('/getDish/defineIngredient',defineIngredient);
};
export const getDish=(formData)=>{
  return apiclient.post('/getDish/defineDish',formData)
}
export const getEvaluate = (dishs, date, users) => {
  return apiclient.post("/getDish/evaluateByUser", {
    dishes: dishs,
    users: users,
    createDate: date
  });
}
export const postUserProfile = (userData) => {
  return apiclient.post('/api/users/profile', userData);
};
export const getUser=()=>
  {
    return apiclient.get("/todo/users")
  }
  export const createTodo=(userData)=>{
    return apiclient.post("/todo/createTodo",userData);
  }
  export const deleteTodo=(id)=>{
    return apiclient.delete("/todo/removeTodo",{params:{
      id:id
    }
  });
  }
  export const getTodos = () => {
    // Backend sẽ trả về List<TodoDto>
    return apiclient.get("/todo/getTodos");
}
export const getAccount=()=>{
    return apiclient.get("/account")
}
export const getALlUser=()=>{
  return apiclient.get("/api/users/getProfile")
}
export const getALlDishCreate=()=>{
  return apiclient.get("/history/getAlldishs");
}
export const updateDish=(data)=>{
  return apiclient.post("/history/update",data)
}
export const getNews=()=>{
  return apiclient.get("/rss/news")
}
export const dishforU=(body)=>{return apiclient.post("/getDish/dishforUser",body)}
export const generateTodo = (id, location) => {
  return apiclient.get("/todo/generateTodo",{params: {
    id: id,
    location: location
  }});
}
export const getRecommendationDish=(id)=>{
return apiclient.get("/history/dishOfUser", {params:{
id:id
}})

}
export const updateDishRecommendation=(body)=>{
  return apiclient.post("/history/updateDishRecommendation",body);
}
export const defineDiase=(bodyPart,symptom,id)=>{
  return apiclient.get("/disease/define",{params:{
bodyPart:bodyPart,
id:id,
    symptom:symptom
  }})
}
