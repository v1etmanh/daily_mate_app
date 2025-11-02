package com.app.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.model.Customer;
import com.app.model.Gender;
import com.app.model.HealthAdviceResponse;
import com.app.model.UserProfile;
import com.app.model.UserProfileCreateRequest;
import com.app.model.UserProfileDto;
import com.app.repository.CustomerRepository;
import com.app.repository.UserProfileRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class UserProfileService {

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private OpenAiService openAiService;
    @Autowired
    private CustomerRepository cusRe;
    public UserProfile createUserProfile(UserProfileCreateRequest request,String email) throws JsonMappingException, JsonProcessingException {
       Customer cus=cusRe.findCustomerByEmail(email);
    	if(cus==null)throw new IllegalArgumentException(" user ko   tồn tại");
    	if (userProfileRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Tên người dùng đã tồn tại");
        }

        // Gọi AI lấy lời khuyên
        HealthAdviceResponse aiResponse = openAiService.getHealthAdvice(request);

        UserProfile userProfile = new UserProfile();
        userProfile.setName(request.getName());
        userProfile.setAge(request.getAge());
        userProfile.setGender(request.getGender());
        userProfile.setHeightCm(request.getHeightCm());
        userProfile.setWeightKg(request.getWeightKg());
        userProfile.setDietaryGoal(request.getDietaryGoal());
        userProfile.setHealthCondition(request.getHealthCondition());
        userProfile.setTastePreference(request.getTastePreference());

        // Set dữ liệu từ AI
        userProfile.setHealthDescription(aiResponse.getHealthDescription());
        userProfile.setRecommendedActivities(aiResponse.getRecommendedActivities());
        userProfile.setWarnings(aiResponse.getWarnings());
        userProfile.setDietAdvice(aiResponse.getDietAdvice());
        userProfile.setTargetWeight(aiResponse.getTargetWeight());
        userProfile.setCusId(cus);
        // => BMI sẽ được tính tự động qua @PrePersist
//       System.out.print(userProfile);
        return userProfileRepository.save(userProfile);
    }
    public List<UserProfileDto> retrieveAllUserProfileByEmail(String email) {
        Customer cus = this.cusRe.findCustomerByEmail(email);
        return cus.getUserProfiles().stream()
            .filter(row -> !row.getName().equals("family")) // loại bỏ user có id = 123
            .map(row -> new UserProfileDto(
                row.getUserId(),
                row.getName(),
                row.getGender().toString(),
                row.getAge(),
                row.getBmi(),
                row.getBmiCategory(),
                row.getWeightKg(),
                row.getTargetWeight(),
                row.getBmr(),
                row.getTdee(),
                row.getRecommendedActivities(),
                row.getWarnings(),
                row.getTastePreference(),
                row.getHealthCondition(),
                row.getDietAdvice(),
                row.getAllergies(),
                row.getDislikedIngredients()
            ))
            .collect(Collectors.toList());
    }

}
