package Green_trade.green_trade_platform.controller;

import Green_trade.green_trade_platform.exception.ForbiddenException;
import Green_trade.green_trade_platform.exception.NotFoundException;
import Green_trade.green_trade_platform.exception.UnauthorizedException;
import Green_trade.green_trade_platform.mapper.PostProductMapper;
import Green_trade.green_trade_platform.mapper.ResponseMapper;
import Green_trade.green_trade_platform.mapper.SellerMapper;
import Green_trade.green_trade_platform.model.PostProduct;
import Green_trade.green_trade_platform.model.Seller;
import Green_trade.green_trade_platform.request.UploadPostProductRequest;
import Green_trade.green_trade_platform.request.VerifiedPostProductRequest;
import Green_trade.green_trade_platform.response.PostProductResponse;
import Green_trade.green_trade_platform.response.RestResponse;
import Green_trade.green_trade_platform.response.SubscriptionResponse;
import Green_trade.green_trade_platform.service.implement.PostProductServiceImpl;
import Green_trade.green_trade_platform.service.implement.SellerServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/seller")
@Slf4j
@RequiredArgsConstructor
public class SellerController {

    private final ResponseMapper responseMapper;
    private final SellerServiceImpl sellerService;
    private final SellerMapper sellerMapper;
    private final PostProductServiceImpl postProductService;
    private final PostProductMapper postProductMapper;

    // ===== ✅ FIXED: CHECK SERVICE PACKAGE VALIDITY =====
    @PreAuthorize("hasRole('ROLE_SELLER')")
    @Operation(
            summary = "Verify Service Package Validity",
            description = """
                This endpoint allows a **seller** to verify whether their current service package is still valid.
                <br><br>
                Workflow:
                <ul>
                    <li>Checks the service subscription associated with the seller's username.</li>
                    <li>Returns whether the package is valid and the expiry date.</li>
                </ul>
                <br>
                <strong>Error Responses:</strong>
                <ul>
                    <li>404 - User or seller not found</li>
                    <li>403 - Seller not approved yet</li>
                    <li>500 - Internal server error</li>
                </ul>
                """,
            parameters = {
                    @Parameter(
                            name = "username",
                            description = "Username of the seller whose service package needs to be verified",
                            required = true,
                            example = "viennehaha"
                    )
            },
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Service package validity checked successfully",
                            content = @Content(
                                    schema = @Schema(implementation = RestResponse.class),
                                    examples = @ExampleObject(
                                            name = "Valid Service Package",
                                            value = """
                                                {
                                                  "success": true,
                                                  "message": "Service package validity checked successfully",
                                                  "data": {
                                                    "valid": true,
                                                    "hasValidPackage": true,
                                                    "sellerId": 456,
                                                    "packageId": 1,
                                                    "packageName": "Premium Seller Plan",
                                                    "expiryDate": "2025-12-31T23:59:59",
                                                    "remainingPosts": 50
                                                  },
                                                  "error": null
                                                }
                                                """
                                    )
                            )
                    ),
                    @ApiResponse(
                            responseCode = "404",
                            description = "User or seller not found",
                            content = @Content(
                                    examples = @ExampleObject(
                                            value = """
                                                {
                                                  "success": false,
                                                  "message": "Seller profile not found for user: username",
                                                  "data": null,
                                                  "error": "NOT_FOUND"
                                                }
                                                """
                                    )
                            )
                    ),
                    @ApiResponse(
                            responseCode = "403",
                            description = "Seller not approved",
                            content = @Content(
                                    examples = @ExampleObject(
                                            value = """
                                                {
                                                  "success": false,
                                                  "message": "Seller not approved. Current status: PENDING",
                                                  "data": null,
                                                  "error": "FORBIDDEN"
                                                }
                                                """
                                    )
                            )
                    )
            },
            tags = {"Seller Management"}
    )
    @PostMapping("/{username}/check-service-package-validity")
    public ResponseEntity<RestResponse<SubscriptionResponse, Object>> checkServicePackageValidity(
            @PathVariable String username) { // ✅ REMOVED "throws Exception"
        
        try {
            log.info("✅ Checking service package validity for username: {}", username);
            
            SubscriptionResponse result = sellerService.checkServicePackageValidity(username);
            
            RestResponse<SubscriptionResponse, Object> response = responseMapper.toDto(
                    true,
                    "Service package validity checked successfully",
                    result,
                    null
            );
            
            log.info("✅ Package validity check successful for username: {}, valid: {}", 
                     username, result.isValid());
            
            return ResponseEntity.ok(response);
            
        } catch (NotFoundException e) {
            // ✅ 404 - User or seller not found
            log.warn("⚠️ Not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    responseMapper.toDto(false,
                            e.getMessage(),
                            null,
                            "NOT_FOUND")
            );
            
        } catch (ForbiddenException e) {
            // ✅ 403 - Seller not approved
            log.warn("⚠️ Forbidden: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    responseMapper.toDto(false,
                            e.getMessage(),
                            null,
                            "FORBIDDEN")
            );
            
        } catch (Exception e) {
            // ✅ 500 - Internal server error (log with stack trace)
            log.error("❌ Error checking service package validity for username: {}", username, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    responseMapper.toDto(false,
                            "Internal server error occurred",
                            null,
                            e.getMessage())
            );
        }
    }

    // ===== ✅ FIXED: GET SELLER PROFILE =====
    @Operation(
            description = """
                Get current authenticated seller's profile.
                <br><br>
                <strong>Requirements:</strong>
                <ul>
                    <li>User must be authenticated (valid JWT token)</li>
                    <li>User must have submitted KYC and have a seller profile</li>
                </ul>
                <br>
                <strong>Error Responses:</strong>
                <ul>
                    <li>401 - User not authenticated</li>
                    <li>404 - Seller profile not found (KYC not submitted)</li>
                    <li>500 - Internal server error</li>
                </ul>
                """,
            summary = "Get seller profile",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Seller profile retrieved successfully",
                            content = @Content(
                                    examples = @ExampleObject(
                                            value = """
                                                {
                                                  "success": true,
                                                  "message": "Get seller profile successfully",
                                                  "data": {
                                                    "sellerId": 456,
                                                    "buyerId": 123,
                                                    "storeName": "My Store",
                                                    "status": "ACCEPTED",
                                                    "taxNumber": "1234567890",
                                                    "createdAt": "2024-01-01T00:00:00",
                                                    "updatedAt": "2024-01-15T10:30:00"
                                                  },
                                                  "error": null
                                                }
                                                """
                                    )
                            )
                    ),
                    @ApiResponse(
                            responseCode = "404",
                            description = "Seller profile not found",
                            content = @Content(
                                    examples = @ExampleObject(
                                            value = """
                                                {
                                                  "success": false,
                                                  "message": "Seller profile not found",
                                                  "data": null,
                                                  "error": "Seller profile not found. Please submit KYC first."
                                                }
                                                """
                                    )
                            )
                    )
            },
            tags = {"Seller Management"}
    )
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            log.info("✅ Getting seller profile for current user");
            
            Seller seller = sellerService.getCurrentUser();
            
            // ✅ Additional null check (defensive programming)
            if (seller == null) {
                log.warn("⚠️ Seller is null for current user");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        responseMapper.toDto(false,
                                "Seller profile not found",
                                null,
                                "Seller profile not found. Please submit KYC first.")
                );
            }
            
            log.info("✅ Seller profile retrieved successfully: sellerId={}, status={}", 
                     seller.getId(), seller.getStatus());
            
            return ResponseEntity.ok(
                    responseMapper.toDto(true,
                            "Get seller profile successfully",
                            sellerMapper.toDto(seller),
                            null)
            );
            
        } catch (UnauthorizedException e) {
            // ✅ 401 - User not authenticated
            log.warn("⚠️ Unauthorized: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    responseMapper.toDto(false,
                            "User not authenticated",
                            null,
                            e.getMessage())
            );
            
        } catch (NotFoundException e) {
            // ✅ 404 - Seller profile not found
            log.warn("⚠️ Seller profile not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    responseMapper.toDto(false,
                            "Seller profile not found",
                            null,
                            e.getMessage())
            );
            
        } catch (Exception e) {
            // ✅ 500 - Internal server error (log with stack trace)
            log.error("❌ Error getting seller profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    responseMapper.toDto(false,
                            "Internal server error occurred",
                            null,
                            e.getMessage())
            );
        }
    }

    // ===== ORIGINAL METHODS (UNCHANGED) =====
    
    @PreAuthorize("hasRole('ROLE_SELLER')")
    @Operation(
            summary = "Upload a product post for selling",
            description = """
                This endpoint allows a **seller** to upload a new post for a product they want to sell.
                <br><br>
                The request consists of:
                <ul>
                    <li>Product details (title, brand, model, price, etc.) in form-data.</li>
                    <li>One or more product images uploaded as multipart files.</li>
                </ul>
                The response returns the created post details after saving it successfully.
                """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    description = "Product post data and uploaded images",
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(implementation = UploadPostProductRequest.class),
                            examples = @ExampleObject(
                                    name = "Example Request",
                                    value = """
                                        {
                                          "sellerId": 5,
                                          "title": "Used Electric Bike",
                                          "brand": "Yadea",
                                          "model": "X5",
                                          "manufactureYear": 2022,
                                          "usedDuration": "6 months",
                                          "conditionLevel": "Good",
                                          "price": 850.00,
                                          "length": "150",
                                          "width": "60",
                                          "height": "110",
                                          "weight": "25000",
                                          "description": "Lightly used electric bike in perfect condition.",
                                          "locationTrading": "Ho Chi Minh City",
                                          "categoryId": 3
                                        }
                                        """
                            )
                    )
            ),
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Product post uploaded successfully",
                            content = @Content(
                                    schema = @Schema(implementation = RestResponse.class),
                                    examples = @ExampleObject(
                                            name = "Success Response",
                                            value = """
                                                {
                                                  "success": true,
                                                  "message": "UPLOADED POST SUCCESSFULLY",
                                                  "data": {
                                                    "postId": 101,
                                                    "sellerId": 5,
                                                    "sellerStoreName": "EcoRider Shop",
                                                    "title": "Used Electric Bike",
                                                    "brand": "Yadea",
                                                    "model": "X5",
                                                    "manufactureYear": 2022,
                                                    "usedDuration": "6 months",
                                                    "conditionLevel": "Good",
                                                    "verifiedDecisionStatus": "PENDING",
                                                    "verified": false,
                                                    "active": true,
                                                    "categoryName": "Electric Vehicles",
                                                    "price": 850.00,
                                                    "locationTrading": "Ho Chi Minh City"
                                                  }
                                                }
                                                """
                                    )
                            )
                    )
            },
            tags = {"Seller Management"}
    )
    @PostMapping("/post-products")
    public ResponseEntity<RestResponse<PostProductResponse, Object>> uploadPostProduct(
            @ModelAttribute UploadPostProductRequest request,
            @RequestPart("pictures") List<MultipartFile> files
    ) throws Exception {
        log.info(">>> Passed came uploadPostProduct");
        log.info(">>> Passed mapped files data: {}", files);

        PostProduct newPostProduct = postProductService.createNewPostProduct(request, files);

        PostProductResponse responseData = postProductMapper.toDto(newPostProduct);

        RestResponse<PostProductResponse, Object> response = responseMapper.toDto(
                true,
                "UPLOADED POST SUCCESSFULLY",
                responseData,
                null
        );

        return ResponseEntity.status(HttpStatus.OK.value()).body(response);
    }

    @PostMapping("/upload-pictures-cloudinary/{id}")
    public ResponseEntity<RestResponse<PostProductResponse, Object>> uploadPostProduct(
            @PathVariable Long id,
            @RequestPart("pictures") List<MultipartFile> files
    ) throws Exception {
        log.info(">>> Passed came uploadPostProduct");
        log.info(">>> Passed mapped files data: {}", files);
        PostProduct newPostProduct = postProductService.uploadPostProductPicture(id, files);
        PostProductResponse responseData = postProductMapper.toDto(newPostProduct);
        RestResponse<PostProductResponse, Object> response = responseMapper.toDto(
                true,
                "UPLOADED POST PICTURES SUCCESSFULLY",
                responseData,
                null
        );
        return ResponseEntity.status(HttpStatus.OK.value()).body(response);
    }

    @PreAuthorize("hasRole('ROLER_SELLER')")
    @Operation(summary = "Request verified for post product",
            description = "Retrun result that the request has been sent")
    @PostMapping("/verified-post-product-request")
    public ResponseEntity<RestResponse<PostProductResponse, Object>> postProductVerifiedRequest(
            @Valid @RequestBody VerifiedPostProductRequest request) throws Exception {
        PostProduct result = postProductService.postProductVerifiedRequest(request);
        PostProductResponse responseData = postProductMapper.toDto(result);
        RestResponse<PostProductResponse, Object> response = responseMapper.toDto(
                true,
                "VERIFIED POST REQUEST SENT",
                responseData,
                null
        );
        return ResponseEntity.status(HttpStatus.OK.value()).body(response);
    }
}

