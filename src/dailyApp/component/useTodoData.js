// src/hooks/useTodoData.js
import { useMemo } from 'react';
import moment from 'moment';

export const useTodoData = (todo, users) => {

    return useMemo(() => {
        
        if (!todo) return null;
        
        const formattedTimeStart = todo.timeStart 
            ? moment(todo.timeStart).format('HH:mm, DD/MM/YYYY') 
            : 'Chưa xác định';
       
        const user = users.find(u => u.id === todo.userId);
        const userName = user ? user.name : 'Không rõ người thực hiện';
       
        const hasExtendedInfo = todo.evaluation || todo.warning || todo.trafficDescription;

        return {
            formattedTimeStart,
            userName,
            hasExtendedInfo,
            basicInfo: {
                time: formattedTimeStart,
                duration: `${todo.estimateTime} giờ`,
                location: todo.location,
               
                performer: userName
            },
            extendedInfo: {
                evaluation: todo.evaluation,
                warning: todo.warning,
                traffic: todo.trafficDescription,
                priority:todo.priority,
healthImpact:todo.healthImpact,
weatherSuitability:todo.weatherSuitability,
preparationNeeded:todo.preparationNeeded,
alternativeActivity:todo.alternativeActivity
            }
        };
    }, [todo, users]);
};