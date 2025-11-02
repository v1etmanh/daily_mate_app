import { useEffect, useState } from "react"
import { getUser } from "../api/ApiConnect";

export default function DishForOne({location,weather}){
    const[users,setUsers]=useState(null);
    useEffect(async()=>{
     const response=await getUser();
     setUsers(response.data);

    },[]) 

const getDishForOne=()=>{
  
}

}