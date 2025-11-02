package com.app.service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.app.model.Customer;
import com.app.model.Location;
import com.app.model.Todo;
import com.app.model.TodoCreateRequest;
import com.app.model.TodoDto;
import com.app.model.TodoDto1;
import com.app.model.TodoEvaluationResponse;
import com.app.model.UserProfile;
import com.app.model.UserProfileDto;
import com.app.model.UserRecord;
import com.app.model.WeatherConditionRequest;
import com.app.repository.CustomerRepository;
import com.app.repository.TodoRepository;
import com.app.repository.UserProfileRepository;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Service
public class TodoService {
@Autowired
private UserProfileRepository userRe;
@Autowired
private TodoRepository todoSer;
@Autowired
private TodoOpenAiService todoOpenAiService;
@Autowired
private GoogleMapsService googleMapsService;
@Autowired
private CustomerRepository cusRe;
public List<UserRecord> retrievedALlUser(String email){
	Customer cus=this.cusRe.findCustomerByEmail(email);
		return	cus.getUserProfiles().stream().map(row->new UserRecord(row.getUserId(), row.getName())).collect(Collectors.toList());
	
}
//tao ra dc 1 todo hoan chinh  bang jpt 
//dau vao jpt là gì ?
//user +todo 
// tao truong con thieu 
// check neu ma can kiem tra ket xe ko thi toi chekc bang api 

//luu vao
public Todo createNewTodo(TodoCreateRequest a) {

   System.out.print(a);
    Todo todo = new Todo();
    todo.setDescription(a.getDescription());
    todo.setTimeStart(a.getTimeStart());
    todo.setEstimateTime(a.getEstimateTime());
   todo.setLocation(a.getLocation());
   String []t=a.getLocation().split(",");
   double lat=Double.parseDouble(t[0]);
   double lon=Double.parseDouble(t[1]);
   WeatherConditionRequest weather=this.getWeatherAtTime(lat, lon, a.getTimeStart());
    UserProfile u=this.userRe.findById(a.getUserId()).get();
    if(u==null)return null;
    // Nếu là hoạt động của gia đình (userId = -1)
    if (u.getName().equals("family")) {
        // Gọi GPT mà không truyền thông tin người dùng
        TodoEvaluationResponse aiResponse = todoOpenAiService.evaluateFamilyTodo(a,weather);
        todo.setEvaluation(aiResponse.getEvaluation());
        todo.setWarning(aiResponse.getWarning());
    } else {
        // Lấy thông tin user
        UserProfile user = userRe.findById(a.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại"));

        // Gắn user cho todo
        todo.setUserProfile(user);

        // Tạo DTO để gửi cho GPT
       

        // Gọi GPT để đánh giá
       
        TodoEvaluationResponse aiResponse = todoOpenAiService.evaluateTodo(user, a,weather);
        todo.setEvaluation(aiResponse.getEvaluation());
        todo.setWarning(aiResponse.getWarning());
        todo.setPriority(aiResponse.getPriority());
        todo.setHealthImpact(aiResponse.getHealthImpact());
        todo.setWeatherSuitability(aiResponse.getWeatherSuitability());
        todo.setPreparationNeeded(aiResponse.getPreparationNeeded());
        todo.setAlternativeActivity(aiResponse.getAlternativeActivity());
    }
    
     
    // Lưu vào DB
    return todoSer.save(todo);
}
@Transactional
public boolean removeTodoById(long id, String email) {
    Customer cus = this.cusRe.findCustomerByEmail(email);
    if (cus == null) return false;

    List<UserProfile> users = cus.getUserProfiles();
    for (UserProfile u : users) {
        // Kiểm tra xem trong danh sách todos của user này có chứa todo với id cần xóa không
        boolean exists = u.getTodos().stream().anyMatch(todo -> todo.getTodoId() == id);
        if (exists) {
          
         this.todoSer.deleteByTodoId(id);  // Gọi service để xóa
            return true;
        }
    }

    return false; // Không tìm thấy todo tương ứng
}
public TodoDto1 convertToDto(Todo todo) {
    return new TodoDto1(
        todo.getTodoId(),
        todo.getDescription(),
        todo.getTimeStart(),
        todo.getEstimateTime(),
        todo.getLocation(),
        todo.getUserProfile() != null ? todo.getUserProfile().getUserId() : null,
        todo.getEvaluation(),
        todo.getWarning(),
        todo.getPriority(),
        todo.getHealthImpact(),
        todo.getWeatherSuitability(),
        todo.getPreparationNeeded(),
        todo.getAlternativeActivity()
    );
}
public List<TodoDto1> retrieveAllTodo(String email){
    Customer cus = this.cusRe.findCustomerByEmail(email);
    
    List<Long> userIds = cus.getUserProfiles()
        .stream()
        .map(UserProfile::getUserId)
        .collect(Collectors.toList());

    List<Todo> todos = this.todoSer.findAllByUserIds(userIds);
    
    // Chuyển sang TodoDto
    return todos.stream()
        .map(this::convertToDto)
        .collect(Collectors.toList());
}
public Todo createTodoByAi(String email, String location, long userId) 
        throws IOException, InterruptedException {
    // Validate inputs
    if (location == null || location.trim().isEmpty()) {
        throw new IllegalArgumentException("Location cannot be null or empty");
    }
    
    String[] coordinates = location.split(",");
    if (coordinates.length != 2) {
        throw new IllegalArgumentException("Location must be in format: lat,lon");
    }
    
    // Find customer
    Customer customer = this.cusRe.findCustomerByEmail(email);
    if (customer == null) {
        throw new EntityNotFoundException("Customer not found");
    }
    
    // Find user profile
    UserProfile us = customer.getUserProfiles().stream()
        .filter(u -> u.getUserId() == userId)
        .findFirst()
        .orElse(null);
        
    if (us == null) {
        throw new EntityNotFoundException("UserProfile not found");
    }
    
    // Parse coordinates
    try {
        double lat = Double.parseDouble(coordinates[0].trim());
        double lon = Double.parseDouble(coordinates[1].trim());
        
        WeatherConditionRequest weather = getWeatherAtTime(lat, lon, LocalDateTime.now());
        TodoDto todod=null;;
        if(us.getName().equals("family")) {
        	todod=this.todoOpenAiService.suggestFamilyActivity(location, weather);
        }
        else { todod = this.todoOpenAiService.suggestPersonalActivity(us, weather);
        }
        // Create and save todo
        Todo todo=new Todo();
        todo.setAlternativeActivity(todod.getAlternativeActivity());
        todo.setDescription(todod.getDescription());
        todo.setEstimateTime(todod.getEstimateTime());
        todo.setEvaluation(todod.getEvaluation());
        todo.setHealthImpact(todod.getHealthImpact());
        todo.setWarning(todod.getWarning());
        todo.setLocation(location);
        todo.setPreparationNeeded(todod.getPreparationNeeded());
        todo.setPriority(todod.getPriority());
        LocalDateTime original = todod.getTimeStart();
        if (original != null) {
            LocalTime timePart = original.toLocalTime(); // chỉ lấy phần giờ/phút/giây
            LocalDate today = LocalDate.now(); // ngày hôm nay
            LocalDateTime updated = LocalDateTime.of(today, timePart);
            todo.setTimeStart(updated);
        } else {
            // fallback nếu null (tuỳ bạn xử lý)
            todo.setTimeStart(LocalDateTime.now());
        }
        todo.setUserProfile(us);
        todo.setWarning(todod.getWarning());
        todo.setWeatherSuitability(todod.getWeatherSuitability());
        this.todoSer.save(todo);
        return this.todoSer.save(todo);
        
    } catch (NumberFormatException e) {
        throw new IllegalArgumentException("Invalid coordinate format", e);
    }
}
public WeatherConditionRequest getWeatherAtTime(double lat, double lon, LocalDateTime dateTime) {
    String apiKey = "251906aeb8ad2c55efaab13f34bcb24a";
    String url = String.format(
        "https://api.openweathermap.org/data/2.5/forecast?lat=%f&lon=%f&appid=%s&units=metric&lang=vi",
        lat, lon, apiKey
    );

    RestTemplate restTemplate = new RestTemplate();
    JsonNode root = restTemplate.getForObject(url, JsonNode.class);

    JsonNode forecastList = root.get("list");
    if (forecastList == null || !forecastList.isArray()) {
        throw new RuntimeException("Không có dữ liệu thời tiết.");
    }

    long targetEpoch = dateTime.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toEpochSecond();

    JsonNode closest = forecastList.get(0);
    long minDiff = Math.abs(closest.get("dt").asLong() - targetEpoch);

    for (JsonNode forecast : forecastList) {
        long diff = Math.abs(forecast.get("dt").asLong() - targetEpoch);
        if (diff < minDiff) {
            minDiff = diff;
            closest = forecast;
        }
    }

    WeatherConditionRequest weather = new WeatherConditionRequest();
    weather.setTemperature(closest.get("main").get("temp").asDouble());
    weather.setFellingTemp(closest.get("main").get("feels_like").asDouble());
    weather.setHumidity(closest.get("main").get("humidity").asInt());
    weather.setPressure(closest.get("main").get("pressure").asInt());
   

    return weather;
}


}

