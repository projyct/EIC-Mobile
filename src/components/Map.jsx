import { useContext, useEffect, useRef } from 'react';

import products from "../products.json";

import Map from "@arcgis/core/Map.js";
import Extent from "@arcgis/core/geometry/Extent";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";
import WebStyleSymbol from "@arcgis/core/symbols/WebStyleSymbol.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import MediaLayer from "@arcgis/core/layers/MediaLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import ExtentAndRotationGeoreference from "@arcgis/core/layers/support/ExtentAndRotationGeoreference";
import VideoElement from "@arcgis/core/layers/support/VideoElement";
import SceneView from "@arcgis/core/views/SceneView";
import Search from "@arcgis/core/widgets/Search";
import Popup from "@arcgis/core/widgets/Popup";

import { MapViewContext } from '../contexts/AppContext';

export default function Home() {
  const mapDiv = useRef(null);
  const { setMapView } = useContext(MapViewContext);

  useEffect(() => {
    let layer_list = [];
    products.forEach(layer => {
      console.log(layer)
      // create a video element by setting video param to point to the video file url
      // set the geographic location of the video file on the map using an extent
      const element = new VideoElement({
        video: layer.video,
        georeference: new ExtentAndRotationGeoreference({
          extent: new Extent({
            xmin: -180,
            ymin: -90,
            xmax: 180,
            ymax: 90,
            spatialReference: {
              wkid: 4326
            }
          })
        })
      });

      // add the video element to the media layer
      const mediaLayer = new MediaLayer({
        source: [element],
        title: layer.name,
        copyright: "NASA's Goddard Space Flight Center",
      });

      layer_list.push(mediaLayer);
    });

    const countryBoundaryLayer = new FeatureLayer({
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0",
      title: "Country Boundaries",
      popupEnabled: false,
      renderer: new SimpleRenderer({
        symbol: new SimpleFillSymbol({
          color: "rgba(0,76,115,0.04)"
        })
      })
    });

    layer_list.push(countryBoundaryLayer);

    const map = new Map({
      layers: layer_list
    });

    const view = new SceneView({
      container: mapDiv?.current,
      map: map,
      center: [-80, 40],
      popupEnabled: true,
      popup: new Popup({
        defaultPopupTemplateEnabled: true,
        dockEnabled: true,
        dockOptions: {
          buttonEnabled: false,
          breakpoint: false
        }
      }),
      constraints: {
        snapToZoom: false,
        altitude: {
          min: 2000000
        }
      }
    });

    const graphicsLayer = new GraphicsLayer();

    view.on("click", (event) => {

      console.log(event.mapPoint.longitude, event.mapPoint.latitude)

      const point = new Point({
        longitude: event.mapPoint.longitude,
        latitude: event.mapPoint.latitude,
      });

      const webStyleSymbol = new WebStyleSymbol({
        name: "Pushpin 3",
        styleName: "EsriIconsStyle"
      });

      const graphic = new Graphic({
        geometry: point,
        symbol: webStyleSymbol
      });
      graphicsLayer.removeAll();
      graphicsLayer.add(graphic);
      view.map.add(graphicsLayer);
    });

    const searchWidget = new Search({
      view: view
    });

    view.ui.add(searchWidget, {
      position: "top-right"
    });

    setMapView(view);

    return () => {
      if (view) {
        // destroy the map view
        view.destroy();
      }
    }
  }, []);

  return (
    <div>
      <div ref={mapDiv} style={{ height: "90vh", marginTop: "10vh" }}></div>
    </div>
  );
}