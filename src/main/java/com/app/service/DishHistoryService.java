package com.app.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.model.Customer;
import com.app.model.DishAdviceResponse;
import com.app.model.DishCreate;
import com.app.model.DishRecommendation;
import com.app.model.DishRecommendationUpdateRequest;
import com.app.model.DishUpdateRequest;
import com.app.model.UserProfile;
import com.app.repository.CustomerRepository;
import com.app.repository.DishRecommendationRepository;
import com.app.repository.DishRepository;
import com.app.repository.DishResponseRepository;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class DishHistoryService {
private final DishRepository disRe;
private final CustomerRepository cusRe;
private final DishResponseRepository dishARe;
private final DishRecommendationRepository dishRecomRe;
public List<DishCreate> retrieveALlDish(String email){
	Customer cus=this.cusRe.findCustomerByEmail(email);
	return cus.getDishCreateId();
}
public List<DishRecommendation> retrieveDishRecommendationByUserId(String email, long userID){
	Customer cus=this.cusRe.findCustomerByEmail(email);
	 UserProfile t = null;
     for (UserProfile u : cus.getUserProfiles()) {
         if (u.getUserId() == userID) {
             t = u;
             break;
         }
     }
     if (t == null) return null;
     
	return t.getDishs();}

public  void UpdateDish(List<DishUpdateRequest> u) {
	for(DishUpdateRequest ui:u) {
	DishAdviceResponse a= this.dishARe.findById(ui.getDishAdviceId()).get();
	a.setChossen(ui.isChossen());
	a.setUserNote(ui.getUserNote());
	a.setMarkFromUser(ui.getMarkFromUser());
	dishARe.save(a);
	}

}
@Transactional
public void updateDishRe(List<DishRecommendationUpdateRequest> ds) {
    for (DishRecommendationUpdateRequest ui : ds) {
        Optional<DishRecommendation> optDish = dishRecomRe.findById(ui.getDishID());
        if (optDish.isPresent()) {
            DishRecommendation a = optDish.get();
            a.setChossen(ui.isChossen());
            a.setUserNote(ui.getUserNote());
            a.setMarkFromUser(ui.getMarkFromUser());
            dishRecomRe.save(a);
        } else {
            System.out.println("Không tìm thấy dish với ID: " + ui.getDishID());
        }
    }
}
}
