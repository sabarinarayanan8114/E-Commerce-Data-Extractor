import { SampleHTML } from "./types";

export const SAMPLE_PRODUCTS: SampleHTML[] = [
  {
    id: "echo-dot",
    label: "Echo Dot (5th Gen) with Clock",
    description: "Amazon US product page segment with standard elements, including a USD price and Alexa features.",
    html: `<!-- Simulated Amazon US Product Details -->
<div id="dp" className="amazon-dp">
  <div id="titleSection" className="a-section">
    <h1 id="title" className="a-size-large">
      <span id="productTitle" className="a-size-large product-title-word-break">
        Echo Dot (5th Gen, 2022 release) with Clock | Smart speaker with Alexa and LED display | Cloud Blue
      </span>
    </h1>
    <a id="bylineInfo" className="a-link-normal" href="#">Visit the Amazon Devices Store</a>
  </div>

  <div id="averageCustomerReviews" className="a-section">
    <span className="a-icon-alt">4.7 out of 5 stars</span>
    <span id="acrCustomerReviewText" className="a-size-base">14,352 ratings</span>
  </div>

  <!-- Pricing Details -->
  <div id="apex_desktop" className="a-section">
    <div className="priceToPay">
      <span className="a-price a-text-price a-size-medium" data-a-size="b" data-a-color="price">
        <span className="a-offscreen">$49.99</span>
        <span aria-hidden="true">
          <span className="a-price-symbol">$</span>
          <span className="a-price-whole">49.</span>
          <span className="a-price-fraction">99</span>
        </span>
      </span>
    </div>
    <div className="basisPrice">
      <span className="a-price a-text-price a-size-small" data-a-size="s">
        <span className="a-offscreen">List Price: $59.99</span>
      </span>
    </div>
  </div>

  <div id="availability" className="a-section">
    <span className="a-size-medium a-color-success">In Stock</span>
  </div>

  <div id="productDescription" className="a-section">
    <p>Our best-sounding Echo Dot yet - Enjoy an improved audio experience compared to any previous Echo Dot with Alexa for clearer vocals, deeper bass and vibrant sound in any room.</p>
  </div>
</div>`
  },
  {
    id: "boat-rockerz",
    label: "boAt Rockerz Bluetooth Earphones",
    description: "Amazon India product page segment in Indian Rupees (INR) with complex pricing and ratings.",
    html: `<!-- Simulated Amazon India Product Details -->
<div id="ppd" className="amazon-in-dp">
  <div id="centerCol" className="col-xs-12">
    <div id="title_feature_div">
      <h1 id="title">
        <span id="productTitle" className="a-size-large product-title-word-break">
          boAt Rockerz 255 Pro+ Bluetooth Neckband with ASAP Charge, up to 40 Hours Playback, Beast Mode (Active Black)
        </span>
      </h1>
    </div>

    <!-- Seller and Brand info -->
    <div id="bylineInfo_feature_div">
      <a id="bylineInfo" href="#">Brand: boAt</a>
    </div>

    <!-- Rating details -->
    <div id="ratings">
      <span className="a-icon-alt">4.2 out of 5 stars</span>
      <span id="customerReviewText">85,219 reviews</span>
    </div>

    <!-- Price Section -->
    <div id="priceBlock">
      <table className="a-line-item-table">
        <tr>
          <td className="a-color-secondary a-size-base">M.R.P.:</td>
          <td><span className="a-price a-text-price a-size-small"><span className="a-offscreen">₹3,990.00</span></span></td>
        </tr>
        <tr>
          <td className="a-color-secondary a-size-base">Deal Price:</td>
          <td>
            <span className="a-price a-text-price a-size-medium a-color-price">
              <span className="a-offscreen">₹1,299.00</span>
              <span className="a-price-whole">1,299</span>
            </span>
          </td>
        </tr>
        <tr>
          <td className="a-color-secondary a-size-base">You Save:</td>
          <td><span className="a-size-base a-color-price">₹2,691.00 (67%)</span></td>
        </tr>
      </table>
    </div>

    <div id="shipping">
      <span>FREE delivery: <b>Tomorrow</b></span>
    </div>
    
    <div id="brand-badge">
      <span className="badge">#1 Best Seller in In-Ear Headphones</span>
    </div>
  </div>
</div>`
  },
  {
    id: "kindle-paperwhite",
    label: "Kindle Paperwhite (UK Store)",
    description: "Amazon UK product segment showcasing British Pounds (GBP) currency and specific features.",
    html: `<!-- Simulated Amazon UK Product Details -->
<div className="dp-container">
  <div className="title-wrapper">
    <h1 id="title" className="product-title">
      <span id="productTitle">Kindle Paperwhite (16 GB) - Now with a 6.8\" display and adjustable warm light - Black</span>
    </h1>
    <p className="author">by Amazon Devices</p>
  </div>

  <div className="review-row">
    <span className="rating">4.8 out of 5</span>
    <span className="count">(12,940 customer ratings)</span>
  </div>

  <div className="price-container">
    <div className="discount-block">
      <span className="saving-percentage">-10%</span>
      <span className="price-symbol">£</span>
      <span className="price-whole">143</span>
      <span className="price-fraction">99</span>
    </div>
    <div className="rrp-price">
      <span>RRP: £159.99</span>
    </div>
  </div>

  <div className="delivery-info">
    <p>Eligible for <b>FREE Delivery</b> in the UK. Prime members get unlimited fast delivery.</p>
  </div>
</div>`
  },
  {
    id: "vintage-book-unavailable",
    label: "Vintage Hardcover (Out of Stock)",
    description: "Demonstrates fallback behavior ('null' price & currency) when a product is unavailable.",
    html: `<!-- Simulated Amazon Out-of-stock Vintage Product -->
<div id="vintage-product-container">
  <div className="header">
    <h1 id="title" className="vintage-title">
      <span id="productTitle">The Great Gatsby - First Edition Facsimile (Hardcover, 1925 Edition)</span>
    </h1>
    <p className="publisher">Scribner's Sons, Published 1925</p>
  </div>

  <div className="availability-status">
    <p className="out-of-stock-alert">Currently unavailable.</p>
    <p className="secondary-alert">We don't know when or if this item will be back in stock.</p>
  </div>

  <div className="description">
    <p>An elegant collector's edition replicating the original cover art and internal layout of F. Scott Fitzgerald's timeless American classic.</p>
  </div>
</div>`
  }
];
