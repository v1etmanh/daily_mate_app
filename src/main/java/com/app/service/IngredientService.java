package com.app.service;

import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;

import com.app.model.Customer;
import com.app.model.DishAdviceResponse;
import com.app.model.DishCreate;
import com.app.model.DishEvaluateRequest;
import com.app.model.DishFormRequest;
import com.app.model.DishRecommendation;
import com.app.model.DishRecommendationDto;
import com.app.model.DishUserRequest;
import com.app.model.EvaluateResult;
import com.app.model.IngredientResponse;
import com.app.model.RequestIngredientCondition;
import com.app.model.UserProfile;
import com.app.model.UserProfileDto;
import com.app.model.UserSuitability;
import com.app.model.UserSuitabilityDTO;
import com.app.repository.CustomerRepository;
import com.app.repository.DishRecommendationRepository;
import com.app.repository.DishRepository;
import com.app.repository.DishResponseRepository;
import com.app.repository.UserProfileRepository;
import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class IngredientService {
    private final DishRepository dishRepository;
    private final UserProfileRepository userProfileRepository;
    private final IngredientAIService ingredientAIService;
    private final DishResponseRepository dishResponseRepository;
    private final GoogleRecipeSearchService ggSearch;
    private final CustomerRepository cusRe;
    private final DishRecommendationRepository dishRecRe;
    public List<IngredientResponse> getIngredients(RequestIngredientCondition request) throws Exception {
        return this.ingredientAIService.getTo30Ingredients(request);
    }
    
    public List<DishEvaluateRequest> getDishes(DishFormRequest request) throws Exception {
        return this.ingredientAIService.getDishesFromAI(request);
    }
    
    /**
     * Hàm đánh giá độ phù hợp của các món ăn dựa trên hồ sơ người dùng
     * @param dishes danh sách món ăn cần đánh giá
     * @return danh sách món ăn đã được cập nhật lời khuyên
     * @throws Exception
     */
    private List<UserSuitability> convertDtoToEntity(List<UserSuitabilityDTO> dtoList, DishAdviceResponse response) {
        if (dtoList == null || dtoList.isEmpty()) {
            return new ArrayList<>();
        }
        
        return dtoList.stream()
            .map(dto -> {
                UserSuitability entity = new UserSuitability();
                entity.setUserName(dto.getUserName());
                entity.setSuitability(dto.getSuitability());
                entity.setScore(dto.getScore());
                entity.setShortNote(dto.getShortNote());
                entity.setDishReponse(response); // Set relationship
                return entity;
            })
            .collect(Collectors.toList());
    }
    @Transactional
    public List<DishAdviceResponse> evaluateDishes(List<DishEvaluateRequest> dishes, String email, Date date,List<UserProfileDto>users) throws Exception {
        // Validate input
        if (dishes == null || dishes.isEmpty()) {
            throw new IllegalArgumentException("Dishes list cannot be empty");
        }
        if (email == null || email.isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        
        // Debug log
        for (DishEvaluateRequest d : dishes) {
            System.out.print(d);
        }
        
        // Lấy danh sách user profile
        Customer cus = this.cusRe.findCustomerByEmail(email);
        if (cus == null) {
            throw new RuntimeException("Customer not found with email: " + email);
        }
        
      
        // Gửi tới AI và nhận kết quả đánh giá (trả về DTO)
        List<EvaluateResult> results = this.ingredientAIService.evaluateDishDetailed(users, dishes);
        
        // Validate results
        if (results == null || results.size() != dishes.size()) {
            throw new RuntimeException("AI response mismatch with request size");
        }

        // Tạo DishCreate entity
        DishCreate dishCreate = new DishCreate();
        dishCreate.setCreateTime(date);
        dishCreate.setCusId(cus);

        // Gộp dữ liệu để tạo danh sách DishAdviceResponse
        List<DishAdviceResponse> adviceList = new ArrayList<>();

        for (int i = 0; i < dishes.size(); i++) {
            DishEvaluateRequest req = dishes.get(i);
            EvaluateResult res = results.get(i);

            DishAdviceResponse response = new DishAdviceResponse();
            response.setName(req.getName());
            response.setUrl(req.getUrl());
            response.setReason(req.getReason());
            response.setCookingMethod(req.getCookingMethod());
            response.setFamilySuitabilityLevel(res.getFamilySuitabilityLevel());
            response.setSuggestionNote(res.getSuggestionNote());
            response.setDishCreate(dishCreate); // liên kết ngược

            // **CONVERT DTO SANG ENTITY**
            List<UserSuitability> userSuitabilities = convertDtoToEntity(res.getUserSuitability(), response);
            response.setUserSuitability(userSuitabilities);

            adviceList.add(response);
        }

        // Gán danh sách món cho DishCreate
        dishCreate.setListDish(adviceList);

        // Lưu vào DB
        this.dishRepository.save(dishCreate);

        return adviceList;
    }

    /**
     * Convert UserSuitabilityDTO sang UserSuitability Entity
     */
 
    public List<DishAdviceResponse> getDishByDate(String email, Date date) {
        Customer cus = this.cusRe.findCustomerByEmail(email);

        // Tìm DishCreate có createTime trùng ngày
        Optional<DishCreate> match = cus.getDishCreateId().stream()
            .filter(dish -> dish.getCreateTime().equals(date))
            .findFirst();

        // Nếu có, trả về danh sách món ăn
        return match.map(DishCreate::getListDish)
                    .orElse(Collections.emptyList());
    }
    public List<DishRecommendation> defineDishByUser(String email, DishUserRequest dishU) throws Exception {
        Customer cus = this.cusRe.findCustomerByEmail(email);

        UserProfile t = null;
        for (UserProfile u : cus.getUserProfiles()) {
            if (u.getUserId() == dishU.user().id()) {
                t = u;
                break;
            }
        }
        if (t == null) return null;
     List<DishRecommendation>ls1=   t.getDishs();
     
        List<DishRecommendationDto> drs = this.ingredientAIService.findDishForOneUser(dishU);
        List<DishRecommendation> ls = new ArrayList<>();
        
        for(DishRecommendation l:ls1) {
       	 if(l.getCreateDate().equals(dishU.createDate())&&l.getMealType().equals(dishU.mealType())) {
       		 ls.add(l);
       	 }
        }
        if(ls.size()!=0)return ls;
        for (DishRecommendationDto dr : drs) {
            DishRecommendation d = new DishRecommendation();
            d.setDishName(dr.dishName());
            d.setUser(t);
            d.setDescription(dr.description());
            d.setMainIngredients(dr.mainIngredients()); // ✅ THÊM
            d.setCalories(dr.calories()); // ✅ SỬA
            
            String url = this.ggSearch.findRecipeUrl(dr.dishName(), dishU.location().getCountry());
            d.setUrl(url);
            
            d.setHealthSuitability(dr.healthSuitability());
            d.setGoalAlignment(dr.goalAlignment());
            d.setTasteMatch(dr.tasteMatch());
            d.setOverallScore(dr.overallScore());
            d.setRecommendationNote(dr.recommendationNote()); // ✅ SỬA
            d.setCreateDate(dishU.createDate());
            d.setCreateDate(dishU.createDate());
            d.setMealType(dishU.mealType());
            this.dishRecRe.save(d);
            ls.add(d);
        }
        
        t.setDishs(ls);
        this.userProfileRepository.save(t);
        return ls;
    }
}
